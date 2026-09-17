import { useEffect, useRef, useState } from 'react';

// Simple wrapper for Leaflet — avoids SSR issues
export default function ProjectMap({ projects = [], height = 500, onMarkerClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.L) {
      // Load Leaflet dynamically if not present
      return;
    }
    initMap();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && projects.length > 0) {
      updateMarkers();
    }
  }, [projects]);

  function getRiskColor(riskScore) {
    if (riskScore >= 70) return '#f43f5e';
    if (riskScore >= 40) return '#f59e0b';
    return '#10b981';
  }

  function initMap() {
    if (mapInstanceRef.current || !mapRef.current) return;
    const L = window.L;

    const initialCenter = projects.length === 1 && projects[0].lat ? [projects[0].lat, projects[0].lng] : [22.5, 80.0];
    const initialZoom = projects.length === 1 ? 17 : 5;

    mapInstanceRef.current = L.map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);

    if (projects.length > 0) updateMarkers();
  }

  function updateMarkers() {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    projects.forEach(p => {
      if (!p.lat || !p.lng) return;
      const color = getRiskColor(p.riskScore || 0);

      const icon = L.divIcon({
        html: `<div style="
          width: 16px; height: 16px; border-radius: 50%;
          background: ${color};
          border: 2px solid white;
          box-shadow: 0 0 8px ${color}88;
          cursor: pointer;
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        className: '',
      });

      const marker = L.marker([p.lat, p.lng], { icon });
      marker.bindPopup(`
        <div style="min-width:220px; font-family: Inter, sans-serif;">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">${p.category || ''}</div>
          <div style="font-size:13px;font-weight:600;color:#f1f5f9;margin-bottom:8px;line-height:1.4">${p.title}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:#94a3b8">Progress</span>
            <span style="font-size:11px;font-weight:600;color:#f1f5f9">${p.completionPct || 0}%</span>
          </div>
          <div style="height:4px;background:#e2e8f0;border-radius:2px;margin-bottom:8px;">
            <div style="height:100%;width:${p.completionPct || 0}%;background:${color};border-radius:2px;"></div>
          </div>
          <div style="font-size:11px;color:#94a3b8">📍 ${p.district}, ${p.state}</div>
          ${p.mpName ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px">🏛️ ${p.mpName}</div>` : ''}
        </div>
      `, { maxWidth: 260 });

      if (onMarkerClick) marker.on('click', () => onMarkerClick(p));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }

  // Initialize map after Leaflet script is ready
  useEffect(() => {
    const checkLeaflet = setInterval(() => {
      if (window.L) {
        clearInterval(checkLeaflet);
        initMap();
      }
    }, 100);
    return () => clearInterval(checkLeaflet);
  }, []);

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 1000,
        background: 'rgba(255, 255, 255,0.9)', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {[['#f43f5e', 'High Risk'], ['#f59e0b', 'Medium Risk'], ['#10b981', 'Low Risk']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}88` }} />
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

