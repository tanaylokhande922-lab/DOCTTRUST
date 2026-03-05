
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Shield, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Dynamic import for Leaflet as it requires window object
const MapWithNoSSR = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse">Loading Interactive Map...</div>
});

const MOCK_PRACTITIONERS = [
  { id: '1', name: 'Dr. Ramesh Babu', specialization: 'Cardiology', verified: true, location: [12.9716, 77.5946] },
  { id: '2', name: 'Dr. Simran', specialization: 'Pediatrics', verified: true, location: [12.9352, 77.6245] },
  { id: '3', name: 'Dr. Anita Roy', specialization: 'Dermatology', verified: false, location: [12.9542, 77.6402] },
  { id: '4', name: 'Dr. Vikrant Singh', specialization: 'General Physician', verified: false, location: [12.9123, 77.6012] },
  { id: '5', name: 'Dr. Sarah Jones', specialization: 'Cardiology', verified: true, location: [12.9800, 77.5800] },
];

export default function PatientPortal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocs, setFilteredDocs] = useState(MOCK_PRACTITIONERS);

  useEffect(() => {
    const filtered = MOCK_PRACTITIONERS.filter(doc => 
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocs(filtered);
  }, [searchTerm]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Search Bar */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
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
              placeholder="Search by specialization (e.g. Cardiology)..." 
              className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-primary rounded-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 ml-4">
           <Badge variant="outline" className="text-muted-foreground border-slate-200 px-3 py-1">
             <Shield className="w-3 h-3 mr-1 text-primary" /> Verified Only
           </Badge>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Results Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 border-r bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Practitioners Found</h2>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{filteredDocs.length} Results</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredDocs.map(doc => (
              <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow border-slate-200 group cursor-pointer">
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
                <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                  <MapPin className="w-3 h-3" />
                  <span>Located in Bangalore</span>
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

        {/* Map View */}
        <section className="flex-1 relative bg-slate-100">
          <MapWithNoSSR practitioners={filteredDocs} />
          
          {/* Map Legend */}
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
                <span className="text-xs font-medium text-slate-600">Pending Verification</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
