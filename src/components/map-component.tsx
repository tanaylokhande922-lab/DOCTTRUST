
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Shield } from 'lucide-react';
import { renderToString } from 'react-dom/server';

interface Practitioner {
  id: string;
  name: string;
  specialization: string;
  verified: boolean;
  location: number[];
}

interface MapProps {
  practitioners: Practitioner[];
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

export default function MapComponent({ practitioners }: MapProps) {
  const center: [number, number] = [12.9716, 77.5946]; // Bangalore center

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      scrollWheelZoom={true} 
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {practitioners.map((doc) => (
        <Marker 
          key={doc.id} 
          position={doc.location as [number, number]} 
          icon={doc.verified ? createVerifiedIcon() : createUnverifiedIcon()}
        >
          <Popup className="rounded-xl overflow-hidden shadow-xl">
            <div className="p-2">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900">{doc.name}</h3>
                {doc.verified && <Shield className="w-3 h-3 text-primary" />}
              </div>
              <p className="text-xs text-slate-500 mb-2">{doc.specialization}</p>
              <button className="w-full py-1.5 px-3 bg-primary text-white text-[10px] font-bold rounded uppercase tracking-wider hover:bg-primary/90 transition-colors">
                Book Appointment
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
