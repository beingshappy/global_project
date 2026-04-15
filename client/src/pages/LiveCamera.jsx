import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Camera, Radio, AlertTriangle, Power, Plus, Trash2, Shield, Activity, X } from 'lucide-react';

const LiveCamera = () => {
  const { alerts } = useContext(SocketContext);
  
  const [cameras, setCameras] = useState([
    { id: 'CAM-1', name: 'Main Gate', source: '0' },
  ]);
  
  const [activeStatus, setActiveStatus] = useState({});
  const [snapshots, setSnapshots] = useState({});
  const [loading, setLoading] = useState({});

  const [newCam, setNewCam] = useState({ name: '', source: '' });
  const [showAdd, setShowAdd] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ai/status');
      const data = await res.json();
      setActiveStatus(data.activeCameras || {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleAI = async (cameraId, source, currentStatus) => {
    setLoading(prev => ({ ...prev, [cameraId]: true }));
    const action = currentStatus === 'ONLINE' ? 'stop' : 'start';
    
    try {
      await fetch('http://localhost:5000/api/ai/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ action, cameraId, source })
      });
      setTimeout(fetchStatus, 1500); 
    } catch (e) {
      console.error(e);
    }
    setLoading(prev => ({ ...prev, [cameraId]: false }));
  };

  useEffect(() => {
    if (alerts.length > 0 && alerts[0].event_id?.image_snapshot) {
      const loc = alerts[0].event_id.location;
      setSnapshots(prev => ({
        ...prev,
        [loc]: alerts[0].event_id.image_snapshot
      }));
    }
  }, [alerts]);

  const handleAddCamera = () => {
    if (!newCam.name || !newCam.source) return;
    const newId = `CAM-${cameras.length + 1}`;
    setCameras([...cameras, { id: newId, ...newCam }]);
    setNewCam({ name: '', source: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-4">
             <Shield className="w-8 h-8 md:w-10 md:h-10 text-primary" /> Security Node Hub
          </h2>
          <p className="text-slate-400 font-medium tracking-tight">Managing global AI surveillance perimeter</p>
        </div>
        
        <button 
          onClick={() => setShowAdd(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.03]"
        >
          <Plus className="w-5 h-5" /> Install Neural Node
        </button>
      </div>

      {/* Add Camera Modal Overlay */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
           <div className="glass-card w-full max-w-lg rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 animate-in zoom-in-95 duration-300 relative">
              <button onClick={() => setShowAdd(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-xl md:text-2xl font-black text-white mb-6 md:mb-8 pr-12 leading-tight">Install Neural Node</h3>
              <div className="space-y-4 md:space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Location Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g. North Perimeter"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 px-5 md:px-6 text-white focus:outline-none focus:border-primary/50 transition-all text-sm"
                      value={newCam.name}
                      onChange={e => setNewCam({...newCam, name: e.target.value})}
                    />
                 </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Camera Source (IP/USB)</label>
                    <input 
                      type="text" 
                      placeholder="0 or RTSP Link"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 px-5 md:px-6 text-white focus:outline-none focus:border-primary/50 transition-all font-mono text-xs md:text-sm"
                      value={newCam.source}
                      onChange={e => setNewCam({...newCam, source: e.target.value})}
                    />
                 </div>
                  <button 
                    onClick={handleAddCamera}
                    className="w-full py-3 md:py-4 bg-primary text-white font-black rounded-xl md:rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 mt-4 transition-all active:scale-95"
                  >
                    Authorize Node
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Grid of Cameras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {cameras.map(cam => {
          const isOnline = activeStatus[cam.id] === 'ONLINE';
          const isLoad = loading[cam.id];
          const latestFrame = snapshots[cam.id];

          return (
            <div key={cam.id} className="glass-card rounded-[2.5rem] overflow-hidden group border-white/5 hover:border-white/10 transition-all duration-500 shadow-2xl">
              <div className="p-6 flex justify-between items-center bg-white/[0.02] border-b border-white/5">
                <div>
                  <h3 className="font-black text-lg text-white tracking-tight flex items-center gap-3">
                    {cam.name} 
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-mono">{cam.id}</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-slate-600'}`}></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button
                    onClick={() => toggleAI(cam.id, cam.source, isOnline ? 'ONLINE' : 'OFFLINE')}
                    disabled={isLoad}
                    className={`p-4 rounded-2xl transition-all shadow-xl ${
                      isOnline ? 'bg-danger/20 text-danger hover:bg-danger/30 shadow-danger/10 neon-border-danger' : 'bg-primary/20 text-primary hover:bg-primary/30 shadow-primary/10 neon-border-primary'
                    }`}
                  >
                    <Power className={`w-5 h-5 ${isLoad ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={() => setCameras(cameras.filter(c => c.id !== cam.id))}
                    className="p-4 rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Feed Window */}
              <div className="relative aspect-video bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                {isOnline ? (
                   latestFrame ? (
                     <div className="relative w-full h-full">
                        <img src={latestFrame} className="w-full h-full object-cover" alt={`${cam.id} Feed`} />
                        <div className="absolute inset-0 border-[20px] border-transparent group-hover:border-white/5 transition-all"></div>
                     </div>
                   ) : (
                     <div className="text-center flex flex-col items-center animate-pulse">
                       <Activity className="w-12 h-12 mb-4 text-primary" />
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Connecting to feed...</p>
                    </div>
                   )
                ) : (
                  <div className="text-center opacity-20 flex flex-col items-center">
                    <Shield className="w-20 h-20 mb-4 text-slate-500" />
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Camera Offline</p>
                  </div>
                )}

                {/* Overlays */}
                {isOnline && (
                  <div className="absolute top-6 left-6 flex gap-3">
                    <div className="bg-danger/80 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest flex items-center gap-2">
                       <Radio className="w-3 h-3 animate-pulse" /> LIVE STREAM
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-6 left-6 text-white text-[10px] font-mono opacity-50 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
                   SRC: {cam.source}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveCamera;
