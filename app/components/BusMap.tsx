'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import type * as Leaflet from 'leaflet';

// Lazy load react-leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });

interface BusStop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  estimated_arrival: string;
  is_next_stop: boolean;
}

interface Bus {
  id: number;
  name: string;
  current_location: { latitude: number; longitude: number; address: string };
  status: string;
  passengers: { current: number; capacity: number; utilization_percentage: number };
  bus_stops: BusStop[];
}

interface BusMapProps {
  busData: Bus;
}

export default function BusMap({ busData }: BusMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [L, setLeaflet] = useState<typeof Leaflet | null>(null);
  const [busIcon, setBusIcon] = useState<Leaflet.Icon | null>(null);
  const [stopIcon, setStopIcon] = useState<Leaflet.Icon | null>(null);

  useEffect(() => {
    setIsClient(true);

    (async () => {
      const leaflet = await import('leaflet');

      const bus = leaflet.icon({
        iconUrl: '/icons/bus.png',
        iconSize: [35, 35],
        iconAnchor: [22, 45],
        popupAnchor: [0, -40],
      });

      const stop = leaflet.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -25],
      });

      setLeaflet(leaflet);
      setBusIcon(bus);
      setStopIcon(stop);
    })();

    return () => {
      const container = document.getElementById('map');
      if (container) container.innerHTML = '';
    };
  }, []);

  if (!isClient || !L || !busIcon || !stopIcon) {
    return <p className="text-center text-gray-500">Loading map...</p>;
  }

  const busStops = busData.bus_stops.map(stop => ({
    id: stop.id,
    name: stop.name,
    position: [stop.latitude, stop.longitude] as [number, number],
    arrival: stop.estimated_arrival,
    isNext: stop.is_next_stop,
  }));

  const busPosition: [number, number] = [
    busData.current_location.latitude,
    busData.current_location.longitude,
  ];

  return (
    <div id="map" className="w-full h-80 rounded-md overflow-hidden border border-gray-300 shadow-sm">
      <MapContainer
        center={busPosition}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Polyline positions={busStops.map(stop => stop.position)} color="gray" weight={4} opacity={0.8} />

        {busStops.map(stop => (
          <Marker key={stop.id} position={stop.position} icon={stopIcon}>
            <Popup>
              <div className="bg-green-100 border border-green-300 p-2 rounded-md text-sm text-gray-800 text-center">
                <strong>{stop.name}</strong>
                <br />
                Next Bus Arrival: <strong>{stop.arrival}</strong>
              </div>
            </Popup>
          </Marker>
        ))}

        <Marker position={busPosition} icon={busIcon}>
          <Popup>
            <div className="bg-yellow-100 border border-yellow-300 p-2 rounded-md text-sm text-gray-800 text-center">
              <strong>{busData.name}</strong>
              <br />
              Status: {busData.status}
              <br />
              Capacity: {busData.passengers.utilization_percentage}%
              <br />
              Next Stop: {busStops.find(stop => stop.isNext)?.name || 'N/A'}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
