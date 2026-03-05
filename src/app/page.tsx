
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const patientImg = PlaceHolderImages.find(img => img.id === 'hero-patient');
  const doctorImg = PlaceHolderImages.find(img => img.id === 'hero-doctor');

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Patient Section */}
      <div className="relative flex-1 group overflow-hidden bg-background">
        {patientImg?.imageUrl && (
          <Image
            src={patientImg.imageUrl}
            alt="Patient Interface"
            fill
            className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
            data-ai-hint="patient doctor search"
          />
        )}
        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-t from-background via-transparent to-transparent">
          <div className="mb-6 p-4 rounded-full bg-primary/10">
            <Search className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Need a Trusted Doctor?</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Browse our directory of verified medical practitioners near you. Search by specialization and verification status.
          </p>
          <Link href="/patient">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg font-semibold shadow-xl">
              Search Verified Doctors
            </Button>
          </Link>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px bg-border relative z-10" />

      {/* Practitioner Section */}
      <div className="relative flex-1 group overflow-hidden bg-accent/10">
        {doctorImg?.imageUrl && (
          <Image
            src={doctorImg.imageUrl}
            alt="Practitioner Interface"
            fill
            className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
            data-ai-hint="medical registration"
          />
        )}
        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-t from-accent/20 via-transparent to-transparent">
          <div className="mb-6 p-4 rounded-full bg-secondary/20">
            <UserPlus className="w-12 h-12 text-secondary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Are You a Practitioner?</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Join the DocTrust network. Register your practice, upload your credentials, and get verified today.
          </p>
          <Link href="/doctor">
            <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 text-lg font-semibold shadow-xl bg-white text-primary border-primary/20 hover:bg-slate-50">
              Register as a Practitioner
            </Button>
          </Link>
        </div>
      </div>

      {/* Branding Logo */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm py-2 px-6 rounded-full shadow-lg border border-primary/10">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
        </div>
        <span className="font-bold text-2xl text-primary tracking-tight">DocTrust</span>
      </div>
    </main>
  );
}
