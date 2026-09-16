import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function SatelliteVerificationModal({ isOpen, onClose, project }) {
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScanProgress(0);
      setScanComplete(false);
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          setScanComplete(true);
          clearInterval(interval);
        }
        setScanProgress(Math.floor(progress));
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  // Use a slight offset to simulate a bounding box around the exact point
  const bounds = [
    [project.lat - 0.001, project.lng - 0.001],
    [project.lat + 0.001, project.lng + 0.001]
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="animate-pulse">🛰️</span> Live Satellite Verification
            </h2>
            <p className="text-slate-400 text-sm">Project ID: {project.id} | Coords: {project.lat.toFixed(4)}, {project.lng.toFixed(4)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 text-2xl leading-none">&times;</button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row relative">
          
          {/* Left Panel: Official Report */}
          <div className="lg:w-1/3 bg-slate-800/50 p-6 border-r border-slate-700 flex flex-col">
            <h3 className="text-orange-500 font-bold mb-4 uppercase tracking-wider text-sm border-b border-orange-500/20 pb-2">Official Status Report</h3>
            <div className="space-y-4">
              <div>
                <div className="text-slate-400 text-xs">Claimed Status</div>
                <div className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                  ✓ 100% COMPLETED
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Funds Disbursed</div>
                <div className="text-white font-mono">₹ {(project.budget / 100000).toFixed(2)} Lakhs</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Implementing Agency</div>
                <div className="text-white">{project.agencyName || 'Local PWD'}</div>
              </div>
              <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="text-slate-300 text-sm mb-2">"Construction finalized and ready for handover. Final installment released."</div>
                <div className="text-slate-500 text-xs">- Official Sign-off Document</div>
              </div>
            </div>
          </div>

          {/* Right Panel: Map */}
          <div className="flex-1 relative bg-slate-900">
            <MapContainer 
              center={[project.lat, project.lng]} 
              zoom={17} 
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              {/* Esri World Imagery (High Res Satellite, Free, No API Key) */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              />
              <Marker position={[project.lat, project.lng]}>
                <Popup>Project Location</Popup>
              </Marker>
              
              {/* Computer Vision Bounding Box Overlay */}
              {scanProgress > 30 && (
                <Rectangle bounds={bounds} pathOptions={{ color: '#ef4444', weight: 3, fillOpacity: 0.2, dashArray: '5, 5' }} />
              )}
            </MapContainer>

            {/* AI Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none z-[1000] p-4 flex flex-col justify-between">
              {/* Scanning Laser Line */}
              {!scanComplete && (
                <div 
                  className="absolute left-0 right-0 h-1 bg-red-500/50 shadow-[0_0_10px_#ef4444]" 
                  style={{ top: `${scanProgress}%`, transition: 'top 0.3s linear' }}
                />
              )}

              {/* Top HUD */}
              <div className="flex justify-between items-start">
                <div className="bg-black/70 backdrop-blur text-red-500 font-mono text-xs p-2 rounded border border-red-500/30">
                  CV ENGINE: ACTIVE<br/>
                  MODEL: RESNET-50 (STRUCTURE DETECT)
                </div>
                <div className="bg-black/70 backdrop-blur text-slate-300 font-mono text-xs p-2 rounded border border-slate-700">
                  ELEVATION: 450m<br/>
                  SOURCE: ESRI SAT
                </div>
              </div>

              {/* Bottom Analysis Box */}
              <div className={`mt-auto transition-all duration-700 ${scanComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-red-900/80 backdrop-blur-md border-l-4 border-red-500 p-4 rounded-r-lg max-w-md shadow-2xl">
                  <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                    <span>⚠️</span> CRITICAL ANOMALY DETECTED
                  </h4>
                  <div className="space-y-1 font-mono text-sm">
                    <div className="flex justify-between text-slate-200">
                      <span>Structure Detected:</span>
                      <span className="text-red-400 font-bold">0%</span>
                    </div>
                    <div className="flex justify-between text-slate-200">
                      <span>Terrain Analysis:</span>
                      <span className="text-slate-300">Barren Land / Dirt</span>
                    </div>
                    <div className="flex justify-between text-slate-200 pt-2 border-t border-red-500/30">
                      <span>Probability of Fraud:</span>
                      <span className="text-red-400 font-bold">99.8%</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition-colors text-sm">
                    ESCALATE TO VIGILANCE DESK
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
