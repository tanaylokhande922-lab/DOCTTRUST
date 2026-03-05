
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Shield, Navigation } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export interface PractitionerMarker {
  id: string;
  name: string;
  specialization: string;
  verified: boolean;
  location: number[];
}

interface MapProps {
  practitioners: PractitionerMarker[];
  userLocation?: [number, number] | null;
  center: [number, number];
  onBookAppointment: (doc: PractitionerMarker) => void;
}

const createVerifiedIcon = () => {
  const html = renderToString(
    <div className="bg-white p-1 rounded-full border-2 border-primary shadow-lg flex items-center justify-center">
      <Shield className="w-5 h-5 text-primary" />
    </div>
  );
  return L.divIcon({
    html: html,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const createUnverifiedIcon = () => {
  const html = renderToString(
    <div className="bg-white p-2 rounded-full border border-slate-300 shadow flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-slate-400" />
    </div>
  );
  return L.divIcon({
    html: html,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createUserIcon = () => {
  const html = renderToString(
    <div className="bg-green-500 p-2 rounded-full border-2 border-white shadow-xl flex items-center justify-center animate-pulse">
      <Navigation className="w-4 h-4 text-white fill-white" />
    </div>
  );
  return L.divIcon({
    html: html,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, map, zoom]);
  return null;
}

export default function MapComponent({ practitioners, userLocation, center, onBookAppointment }: MapProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      scrollWheelZoom={true} 
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {userLocation && <MapUpdater center={userLocation} />}
      {!userLocation && <MapUpdater center={center} />}

      {userLocation && (
        <Marker position={userLocation} icon={createUserIcon()}>
          <Popup>
            <div className="text-center font-bold text-xs p-1">You are here</div>
          </Popup>
        </Marker>
      )}

      {practitioners.map((doc) => (
        <Marker 
          key={doc.id} 
          position={doc.location as [number, number]} 
          icon={doc.verified ? createVerifiedIcon() : createUnverifiedIcon()}
        >
          <Popup className="rounded-xl overflow-hidden shadow-xl">
            <div className="p-2 min-w-[150px]">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900">{doc.name}</h3>
                {doc.verified && <Shield className="w-3 h-3 text-primary" />}
              </div>
              <p className="text-xs text-slate-500 mb-3">{doc.specialization}</p>
              <Button 
                onClick={() => onBookAppointment(doc)}
                className="w-full h-8 text-[10px] font-bold uppercase tracking-wider"
              >
                Book Appointment
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
