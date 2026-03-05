
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle2, Upload, Activity, AlertCircle, Map as MapIcon, Loader2, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFirestore, useUser, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function DoctorPortal() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();

  const [step, setStep] = useState<'register' | 'verify' | 'scanning' | 'status'>('register');
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    mrn: '',
  });
  const [scanProgress, setScanProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED' | 'MANUAL_REVIEW_REQUIRED' | 'PENDING' | 'UNVERIFIED'>('UNVERIFIED');

  // Sign in anonymously if not authenticated to ensure we have a UID for Firestore
  useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  // Handle scanning simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'scanning') {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            handleVerificationLogic();
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.specialization) return;
    setStep('verify');
  };

  const startScan = () => {
    if (!formData.mrn) return;
    setStep('scanning');
    setScanProgress(0);
  };

  const handleVerificationLogic = () => {
    const isSuccess = formData.mrn === '8978456556';
    const status = isSuccess ? 'VERIFIED' : 'MANUAL_REVIEW_REQUIRED';
    
    setVerificationStatus(status);
    
    // Update Firestore optimistically
    if (user && db) {
      const practitionerRef = doc(db, 'practitioners', user.uid);
      const data = {
        id: user.uid,
        name: formData.name,
        specialization: formData.specialization,
        medicalRegistrationNumber: formData.mrn,
        verifiedStatus: status,
        latitude: 21.361862, // Demo location in Shirpur
        longitude: 74.878921,
        certificateUrl: 'https://placehold.co/600x400/png?text=Medical+Certificate',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      setDoc(practitionerRef, data, { merge: true })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: practitionerRef.path,
            operation: 'write',
            requestResourceData: data,
          }));
        });
    }

    if (isSuccess) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0052CC', '#54D4E6', '#ffffff']
      });
    }
    
    setStep('status');
  };

  if (step === 'scanning') {
    return (
      <div className="min-h-screen bg-[#F3F6F7] flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-slate-100 p-8 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Activity className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Analyzing Credentials...</h2>
            <p className="text-slate-500">Scanning medical certificate for authenticity</p>
          </div>
          <div className="space-y-4">
            <Progress value={scanProgress} className="h-3" />
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Extracting Data</span>
              <span>{scanProgress}%</span>
            </div>
          </div>
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
              <MapIcon className="w-5 h-5" /> Return to Map
            </Button>
            <Button variant="ghost" className="text-slate-500" onClick={() => setStep('verify')}>
              Try another ID
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
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
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
        ) : (
          <Card className="shadow-2xl border-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle>Step 2: Medical Verification</CardTitle>
              <CardDescription>We verify all practitioners against official records.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="space-y-2">
                <Label htmlFor="mrn">Medical Registration Number (MRN)</Label>
                <div className="relative">
                   <Input 
                    id="mrn" 
                    placeholder="Enter Registration ID" 
                    className="h-12 border-slate-200 pr-10" 
                    value={formData.mrn}
                    onChange={(e) => setFormData({...formData, mrn: e.target.value})}
                  />
                </div>
                <p className="text-xs text-slate-400">Try ID: 8978456556 for instant demo validation.</p>
              </div>

              <div className="space-y-4">
                <Label>Verification Certificate (PDF/Image)</Label>
                <div 
                  onClick={startScan}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-primary/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-700">Drop certificate here</h4>
                  <p className="text-sm text-slate-500">Maximum file size: 5MB (JPG, PNG or PDF)</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-8 flex flex-col gap-4">
              <Button 
                onClick={startScan} 
                size="lg" 
                className="w-full h-12 text-lg font-bold shadow-lg"
                disabled={!formData.mrn}
              >
                Scan & Verify Certificate
              </Button>
              <Button variant="ghost" onClick={() => setStep('register')} className="text-slate-500 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to profile
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
