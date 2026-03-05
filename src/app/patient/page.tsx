
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Shield, Info, Navigation, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth, initiateAnonymousSignIn, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PractitionerMarker } from '@/components/map-component';

const MapWithNoSSR = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse text-muted-foreground font-medium">Loading Interactive Map...</div>
});

const DEFAULT_CENTER: [number, number] = [21.361862, 74.878921];

const MOCK_PRACTITIONERS = [
  { id: '1', name: 'Dr. Aarav Sharma', specialization: 'Cardiology', verified: true, location: [21.365, 74.880] },
  { id: '2', name: 'Dr. Priya Patel', specialization: 'Pediatrics', verified: true, location: [21.360, 74.875] },
  { id: '3', name: 'Dr. Vikram Singh', specialization: 'Dermatology', verified: false, location: [21.370, 74.885] },
  { id: '4', name: 'Dr. Ananya Iyer', specialization: 'General Physician', verified: true, location: [21.355, 74.870] },
  { id: '5', name: 'Dr. Rohan Mehta', specialization: 'Orthopedics', verified: true, location: [21.368, 74.872] },
];

export default function PatientPortal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocs, setFilteredDocs] = useState<PractitionerMarker[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  
  // Booking State
  const [selectedDoctor, setSelectedDoctor] = useState<PractitionerMarker | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
  const [bookingTime, setBookingTime] = useState<string>('09:00');
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  const db = useFirestore();
  const practitionersQuery = useMemoFirebase(() => collection(db, 'practitioners'), [db]);
  const { data: dbPractitioners } = useCollection(practitionersQuery);

  // Ensure user is signed in for booking capability
  useEffect(() => {
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  useEffect(() => {
    const realDocs = dbPractitioners?.map(doc => ({
      id: doc.id,
      name: doc.name,
      specialization: doc.specialization,
      verified: doc.verifiedStatus === 'VERIFIED',
      location: [doc.latitude, doc.longitude]
    })) || [];

    const allDocs = [...MOCK_PRACTITIONERS, ...realDocs];

    const filtered = allDocs.filter(doc => 
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocs(filtered);
  }, [searchTerm, dbPractitioners]);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser doesn't support location sharing.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
        toast({
          title: "Location Shared",
          description: "Finding doctors near your live position.",
        });
      },
      (error) => {
        setIsLocating(false);
        toast({
          variant: "destructive",
          title: "Location access denied",
          description: "Please enable location permissions.",
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleConfirmBooking = () => {
    if (!selectedDoctor || !user || !bookingDate) return;

    const appointmentDate = new Date(bookingDate);
    const [hours, minutes] = bookingTime.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes));

    const appointmentData = {
      practitionerId: selectedDoctor.id,
      patientId: user.uid,
      date: appointmentDate.toISOString(),
      status: 'PENDING',
      createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(db, 'appointments'), appointmentData);
    setIsBookingSuccess(true);
  };

  const closeBooking = () => {
    setSelectedDoctor(null);
    setIsBookingSuccess(false);
    setBookingDate(new Date());
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="font-bold text-xl text-primary flex items-center gap-2 mr-6 shrink-0">
             <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm rotate-45" />
             </div>
             DocTrust
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search specialization or name..." 
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-full w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant={userLocation ? "secondary" : "outline"} 
            className="rounded-full gap-2 hidden sm:flex"
            onClick={handleShareLocation}
            disabled={isLocating}
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            {userLocation ? 'Live Location On' : 'Share Live Location'}
          </Button>
          <div className="hidden md:flex items-center gap-4">
             <Badge variant="outline" className="text-muted-foreground border-slate-200 px-3 py-1">
               <Shield className="w-3 h-3 mr-1 text-primary" /> Verified Only
             </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-80 lg:w-96 border-r bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Practitioners</h2>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{filteredDocs.length} Results</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredDocs.map(doc => (
              <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow border-slate-200 group cursor-pointer bg-white" onClick={() => setSelectedDoctor(doc)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{doc.name}</h3>
                    <p className="text-sm text-slate-500">{doc.specialization}</p>
                  </div>
                  {doc.verified ? (
                    <div className="p-1 rounded bg-blue-50">
                      <Shield className="w-5 h-5 text-primary fill-blue-100" />
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 mr-2" />
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span>Nearby Practice</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold text-primary hover:bg-primary/10">
                    Quick Book
                  </Button>
                </div>
              </Card>
            ))}
            {filteredDocs.length === 0 && (
              <div className="text-center py-12">
                <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">No doctors found matching your criteria.</p>
              </div>
            )}
          </div>
        </aside>

        <section className="flex-1 relative bg-slate-100">
          <MapWithNoSSR 
            practitioners={filteredDocs} 
            userLocation={userLocation} 
            center={DEFAULT_CENTER} 
            onBookAppointment={(doc) => setSelectedDoctor(doc)}
          />
          
          <div className="absolute top-4 right-4 z-[1000] sm:hidden">
            <Button size="icon" variant="secondary" className="rounded-full shadow-lg" onClick={handleShareLocation} disabled={isLocating}>
              <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="absolute bottom-6 right-6 z-[1000] bg-white p-4 rounded-xl shadow-2xl border border-slate-100 max-w-[200px]">
            <h4 className="font-bold text-xs uppercase text-slate-400 mb-3 tracking-widest">Legend</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-slate-600">Verified Doctor</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                   <div className="w-2 h-2 rounded-full bg-slate-400" />
                </div>
                <span className="text-xs font-medium text-slate-600">Pending</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Appointment Dialog */}
      <Dialog open={!!selectedDoctor} onOpenChange={(open) => !open && closeBooking()}>
        <DialogContent className="sm:max-w-[425px]">
          {isBookingSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">Booking Confirmed!</h3>
              <p className="text-slate-500">Your appointment with {selectedDoctor?.name} has been requested.</p>
              <Button onClick={closeBooking} className="w-full mt-6">Done</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Book Appointment</DialogTitle>
                <DialogDescription>
                  Choose a date and time for your visit with <strong>{selectedDoctor?.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> Select Date
                  </label>
                  <Calendar
                    mode="single"
                    selected={bookingDate}
                    onSelect={setBookingDate}
                    className="rounded-md border mx-auto"
                    disabled={(date) => date < new Date()}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Select Time
                  </label>
                  <Select value={bookingTime} onValueChange={setBookingTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">09:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                      <SelectItem value="14:00">02:00 PM</SelectItem>
                      <SelectItem value="15:00">03:00 PM</SelectItem>
                      <SelectItem value="16:00">04:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeBooking}>Cancel</Button>
                <Button onClick={handleConfirmBooking} disabled={!bookingDate}>Confirm Appointment</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
