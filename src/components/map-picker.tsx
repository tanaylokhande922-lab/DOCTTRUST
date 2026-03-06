'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Shield, MapPin } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { useEffect } from 'react';

interface MapPickerProps {
    location: { lat: number, lng: number } | null;
    setLocation: (location: { lat: number, lng: number }) => void;
    center?: [number, number];
}

const createPinIcon = () => {
    const html = renderToString(
        <div className="bg-white p-1 rounded-full border-2 border-primary shadow-lg flex items-center justify-center animate-bounce">
            <MapPin className="w-5 h-5 text-primary" />
        </div>
    );
    return L.divIcon({
        html: html,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
};

function LocationMarker({ location, setLocation }: { location: { lat: number, lng: number } | null, setLocation: (location: { lat: number, lng: number }) => void }) {
    const map = useMapEvents({
        click(e) {
            setLocation(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return location === null ? null : (
        <Marker position={location} icon={createPinIcon()}>
            <Popup>
                Practice Location set!
            </Popup>
        </Marker>
    );
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function MapPicker({ location, setLocation, center = [21.361862, 74.878921] }: MapPickerProps) {
    return (
        <MapContainer
            center={location ? [location.lat, location.lng] : center}
            zoom={14}
            scrollWheelZoom={true}
            className="w-full h-[200px] rounded-xl border border-slate-200 shadow-inner z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {location && <MapUpdater center={[location.lat, location.lng]} />}
            <LocationMarker location={location} setLocation={setLocation} />
        </MapContainer>
    );
}
