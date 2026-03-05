
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, Upload, FileText, Activity, AlertCircle, UserPlus } from 'lucide-react';
import confetti from 'canvas-confetti';

const MOCK_OFFICIAL_LIST = [
  { id: '8978456556', name: 'Dr. Ramesh Babu' },
  { id: '1122334455', name: 'Dr. Simran' },
];

export default function DoctorPortal() {
  const [step, setStep] = useState<'register' | 'verify' | 'dashboard'>('register');
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    mrn: '',
  });
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.specialization) return;
    setStep('verify');
  };

  const handleVerify = () => {
    setError('');
    const match = MOCK_OFFICIAL_LIST.find(item => item.id === formData.mrn);
    
    if (match) {
      setIsVerified(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0052CC', '#54D4E6', '#ffffff']
      });
      setTimeout(() => setStep('dashboard'), 2000);
    } else {
      setError('Registration ID not found in official registry. Manual review required.');
    }
  };

  const triggerFileUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
        setIsUploading(false);
    }, 1500);
  };

  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Practitioner Dashboard</h1>
              <p className="text-slate-500">Welcome back, {formData.name || 'Doctor'}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-100 text-primary border-blue-200 px-4 py-1.5 h-10 flex gap-2">
                <Shield className="w-4 h-4" /> Verified Professional
              </Badge>
              <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Verification Progress</CardTitle>
                <CardDescription>View your current verification status and next steps.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative pl-8 border-l-2 border-primary space-y-8">
                  <div className="relative">
                    <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-primary" />
                    <h4 className="font-bold text-slate-900">Registration Submitted</h4>
                    <p className="text-sm text-slate-500">Basic profile information completed on DocTrust.</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-primary" />
                    <h4 className="font-bold text-slate-900">Certificate Validation</h4>
                    <p className="text-sm text-slate-500">Medical Council registration verified successfully.</p>
                  </div>
                  <div className="relative">
                     <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-primary animate-pulse" />
                     <h4 className="font-bold text-slate-900">Network Integration</h4>
                     <p className="text-sm text-slate-500">Synchronizing your profile with the public health map.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-primary text-white border-none shadow-xl">
                 <CardHeader>
                    <Activity className="w-8 h-8 mb-2 opacity-80" />
                    <CardTitle>Profile Analytics</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-4xl font-bold mb-1">248</div>
                    <p className="text-sm opacity-80">Patient views this week</p>
                 </CardContent>
              </Card>
              <Card>
                 <CardHeader>
                    <CardTitle className="text-sm">Quick Settings</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start gap-2">
                       <UserPlus className="w-4 h-4" /> Edit Profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                       <FileText className="w-4 h-4" /> Download Badge
                    </Button>
                 </CardContent>
              </Card>
            </div>
          </div>
        </div>
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
                    onChange={(e) => {
                      setFormData({...formData, mrn: e.target.value});
                      setError('');
                    }}
                  />
                  {isVerified && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />}
                </div>
                <p className="text-xs text-slate-400">Example IDs: 8978456556 or 1122334455 for instant demo validation.</p>
              </div>

              <div className="space-y-4">
                <Label>Verification Certificate (PDF/Image)</Label>
                <div 
                  onClick={triggerFileUpload}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-primary/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {isUploading ? <Activity className="w-6 h-6 text-primary animate-spin" /> : <Upload className="w-6 h-6 text-slate-400" />}
                  </div>
                  <h4 className="font-bold text-slate-700">{isUploading ? 'Uploading...' : 'Drop certificate here'}</h4>
                  <p className="text-sm text-slate-500">Maximum file size: 5MB (JPG, PNG or PDF)</p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3 text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pb-8 flex flex-col gap-4">
              <Button 
                onClick={handleVerify} 
                size="lg" 
                className={`w-full h-12 text-lg font-bold shadow-lg transition-all ${isVerified ? 'bg-green-600 hover:bg-green-700' : ''}`}
                disabled={!formData.mrn || isVerified}
              >
                {isVerified ? 'Verification Successful!' : 'Verify Registration'}
              </Button>
              <Button variant="ghost" onClick={() => setStep('register')} className="text-slate-500">
                Back to profile
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
