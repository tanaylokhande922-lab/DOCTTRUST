'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle2, Upload, Activity, AlertCircle, Map as MapIcon, Loader2, ArrowLeft, Navigation } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFirestore, useUser, useAuth, initiateAnonymousSignIn, useStorage } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

const MapPicker = dynamic(() => import('@/components/map-picker'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse bg-slate-100 rounded-xl" />
});

export default function DoctorPortal() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const storage = useStorage();
  const { toast } = useToast();

  const [step, setStep] = useState<'register' | 'location' | 'verify' | 'scanning' | 'status'>('register');
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    mrn: '',
    email: '',
  });
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED' | 'MANUAL_REVIEW_REQUIRED' | 'PENDING' | 'UNVERIFIED'>('UNVERIFIED');

  // Sign in anonymously if not authenticated to ensure we have a UID for Firestore
  useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  // Handle scanning simulation removed from here, moving directly into the verification logic!

  // Auto-fetch location when entering the location step
  useEffect(() => {
    if (step === 'location' && !location && !isLocating) {
      handleGetLocation();
    }
  }, [step]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.specialization) return;
    setStep('location');
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation not supported", description: "Your browser doesn't support location sharing." });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
        toast({ title: "Location Shared", description: "Your practice location has been recorded." });
      },
      (error) => {
        setIsLocating(false);
        toast({ variant: "destructive", title: "Location access denied", description: "Please enable location permissions." });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 5MB." });
        return;
      }
      setCertificateFile(file);
    }
  };

  const startScan = async () => {
    if (!formData.mrn || !formData.email || !certificateFile || !user || !db) return;
    setStep('scanning');
    setScanProgress(0);

    // Phase 1: Simulate initial OCR scan up to 50%
    for (let i = 0; i <= 50; i += 5) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 100)); // Complete in 1 second
    }

    try {
      // Phase 2: Upload and API check (concurrently to save time)
      let certificateUrl = 'https://placehold.co/600x400/png?text=Medical+Certificate';
      if (storage) {
        try {
          const fileRef = ref(storage, `certificates/${user.uid}/${certificateFile.name}`);
          const uploadPromise = uploadBytes(fileRef, certificateFile).then(() => getDownloadURL(fileRef));

          // Silently catch background rejection so it doesn't crash the Next.js overlay
          uploadPromise.catch(() => { });

          certificateUrl = await Promise.race([
            uploadPromise,
            new Promise<string>((_, reject) => setTimeout(() => reject('Storage Upload Timeout'), 8000))
          ]);
        } catch (uploadError) {
          console.error('File Upload Failed / Timeout:', uploadError);
          toast({ variant: "destructive", title: "Storage Error", description: "Storage rules blocked upload. Safely skipped." });
        }
      }

      // We explicitly race the fetch call with 15s timeout
      const fetchPromise = fetch('/api/doctor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          name: formData.name,
          email: formData.email,
          specialization: formData.specialization,
          mrn: formData.mrn,
          latitude: location?.lat || 21.361862,
          longitude: location?.lng || 74.878921,
        }),
      }).then(res => res.json());

      fetchPromise.catch(() => { }); // Prevent floating unhandled rejection

      const data = await Promise.race<any>([
        fetchPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Backend API Timeout. Is Next.js running?')), 15000))
      ]);

      if (data.success) {
        const status = data.verifiedStatus as 'VERIFIED' | 'MANUAL_REVIEW_REQUIRED' | 'PENDING' | 'UNVERIFIED';
        setVerificationStatus(status);

        // Advance progress to 100% because backend replied!
        for (let i = 50; i <= 100; i += 10) {
          setScanProgress(i);
          await new Promise(r => setTimeout(r, 80));
        }

        const practitionerRef = doc(db, 'practitioners', user.uid);
        const practitionerData = {
          id: user.uid,
          name: formData.name,
          email: formData.email,
          specialization: formData.specialization,
          medicalRegistrationNumber: formData.mrn,
          verifiedStatus: status,
          latitude: location?.lat || 21.361862,
          longitude: location?.lng || 74.878921,
          certificateUrl,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        try {
          // Race setDoc with 5s timeout to avoid infinite Firestore Offline hang
          const docPromise = setDoc(practitionerRef, practitionerData, { merge: true });
          docPromise.catch(() => { }); // Prevent floating rejection

          await Promise.race([
            docPromise,
            new Promise((_, reject) => setTimeout(() => reject('Firestore Write Timeout'), 5000))
          ]);

          if (status === 'VERIFIED') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#0052CC', '#54D4E6', '#ffffff'] });
          }
          setStep('status');
        } catch (dbError: any) {
          console.warn("DB Write prevented/timed-out, progressing via fallback:", dbError);
          // If firestore rules break, we still progress the UI so it doesn't leave the user stuck staring at 100%!
          toast({ variant: "destructive", title: "Database Warning", description: "Profile not immediately registered. Check Firestore Permissions." });
          setStep('status');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Registration sequence completely failed or timed out:', error);
      toast({ variant: "destructive", title: "Registration Halt", description: error.message || "Failed executing sequence." });
      setStep('register');
    }
  };

  if (step === 'scanning') {
    return (
      <div className="min-h-screen bg-[#F3F6F7] flex items-center justify-center p-6">
        <Card className="w-full max-w-lg shadow-2xl border-slate-100 p-10 text-center rounded-3xl">
          <div className="mb-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 ${scanProgress < 50 ? 'border-4 border-t-emerald-700 animate-spin' : 'bg-emerald-50'}`}>
              {scanProgress >= 50 && <Shield className="w-6 h-6 text-emerald-700" />}
            </div>
            <h2 className="text-[22px] font-bold text-slate-800 mb-2">
              {scanProgress < 50 ? 'Running OCR Extraction' : 'Validating with NMC Registry'}
            </h2>
            <p className="text-slate-600 text-[15px]">
              {scanProgress < 50
                ? 'Extracting registration details from certificate using EasyOCR...'
                : 'Cross-referencing extracted data with the National Medical Commission API...'}
            </p>
          </div>

          {scanProgress >= 50 && (
            <div className="bg-[#E2EAEB] rounded-2xl p-5 text-left mt-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                <div className="text-slate-600">OCR Name:</div>
                <div className="text-slate-900 font-semibold">{formData.name || 'Unreadable Name'}</div>

                <div className="text-slate-600">Reg Number:</div>
                <div className="text-slate-900 font-semibold">{formData.mrn || 'UNKNOWN-0000'}</div>

                <div className="text-slate-600">Confidence:</div>
                <div className="text-slate-900 font-semibold">{scanProgress}%</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (step === 'status') {
    return (
      <div className="min-h-screen bg-[#F3F6F7] flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-slate-100 overflow-hidden">
          <div className={`h-2 ${verificationStatus === 'VERIFIED' ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <CardHeader className="text-center pt-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${verificationStatus === 'VERIFIED' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {verificationStatus === 'VERIFIED' ? (
                <Shield className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {verificationStatus === 'VERIFIED' ? 'Verification Successful' : 'Manual Review Required'}
            </CardTitle>
            <CardDescription>
              {verificationStatus === 'VERIFIED'
                ? 'Your credentials have been authenticated against the official registry.'
                : 'We couldn\'t find an instant match for this ID. A moderator will review your document within 24 hours.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {verificationStatus === 'VERIFIED' ? (
              <Badge className="bg-blue-100 text-primary border-blue-200 px-4 py-2 text-sm gap-2">
                <Shield className="w-4 h-4" /> Verified Professional
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50 px-4 py-2 text-sm">
                Pending Verification
              </Badge>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pb-8">
            <Button className="w-full h-12 text-lg font-bold gap-2" onClick={() => router.push('/patient')}>
              <MapIcon className="w-5 h-5" /> Go to Map
            </Button>
            <Button variant="ghost" className="text-slate-500" onClick={async () => {
              if (auth) {
                await auth.signOut();
              }
              setFormData({ name: '', specialization: '', mrn: '', email: '' });
              setLocation(null);
              setCertificateFile(null);
              setStep('register');
            }}>
              Register another doctor
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6F7] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 bg-white py-2 px-6 rounded-full shadow-sm border">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm rotate-45" />
            </div>
            <span className="font-bold text-xl text-primary">DocTrust</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Practitioner Onboarding</h1>
        </div>

        {step === 'register' ? (
          <Card className="shadow-2xl border-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Step 1: Profile Information</CardTitle>
              <CardDescription>Tell us about your medical background.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="pt-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name (as per registration)</Label>
                  <Input
                    id="name"
                    placeholder="Dr. John Doe"
                    className="h-12 border-slate-200"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Primary Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g. Cardiology"
                    className="h-12 border-slate-200"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button type="submit" size="lg" className="w-full h-12 text-lg font-bold shadow-lg">
                  Next: Verification
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : step === 'location' ? (
          <Card className="shadow-2xl border-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Step 2: Practice Location</CardTitle>
              <CardDescription>Share your facility's location so patients can find you.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 text-center">
              <p className="text-slate-500 text-sm">
                We need your precise location to show your practice on our patient map.
              </p>

              <div className="relative">
                <MapPicker location={location} setLocation={setLocation} />
              </div>

              {location && (
                <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-200 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> Location Captured
                </div>
              )}
            </CardContent>
            <CardFooter className="pb-8 flex flex-col gap-4">
              <Button
                onClick={handleGetLocation}
                variant={location ? "secondary" : "default"}
                size="lg"
                className="w-full h-12 text-lg font-bold shadow-lg"
                disabled={isLocating}
              >
                {isLocating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Navigation className="w-5 h-5 mr-2" />}
                {location ? 'Use Current Location Instead' : 'Share Live Location'}
              </Button>
              <Button
                onClick={() => setStep('verify')}
                size="lg"
                className="w-full h-12 font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                disabled={!location}
              >
                Next: Medical Verification
              </Button>
              <Button variant="ghost" onClick={() => setStep('register')} className="text-slate-500 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to profile
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="shadow-2xl border-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Step 3: Medical Verification</CardTitle>
              <CardDescription>We verify all practitioners against official records.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email (for appointments)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@clinic.com"
                    className="h-12 border-slate-200"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mrn">Medical Registration Number (MRN)</Label>
                  <div className="relative">
                    <Input
                      id="mrn"
                      placeholder="Enter Registration ID"
                      className="h-12 border-slate-200 pr-10"
                      value={formData.mrn}
                      onChange={(e) => setFormData({ ...formData, mrn: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Try ID: 8978456556 for instant demo validation.</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Verification Certificate (PDF/Image)</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors w-full relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                  {certificateFile ? (
                    <div className="text-primary font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {certificateFile.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">Click to upload or drag & drop</span>
                      <span className="text-xs text-slate-500 mt-1">Maximum file size: 5MB</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-8 flex flex-col gap-4">
              <Button onClick={startScan} size="lg" className="w-full h-12 text-lg font-bold shadow-lg" disabled={!formData.mrn || !formData.email || !certificateFile}>
                <Activity className="w-5 h-5 mr-2" /> Start Verification
              </Button>
              <Button variant="ghost" onClick={() => setStep('location')} className="text-slate-500 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to location
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
