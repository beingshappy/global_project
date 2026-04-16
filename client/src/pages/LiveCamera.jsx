import { useContext, useEffect, useRef, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Maximize2, Minimize2, Radio, Power, Plus, Trash2, Shield, Activity, X } from 'lucide-react';

const LiveCamera = () => {
  const { alerts, socket } = useContext(SocketContext);

  const [cameras, setCameras] = useState([
    { id: 'CAM-1', name: 'System Camera', source: '0' },
  ]);

  const [activeStatus, setActiveStatus] = useState({});
  const [liveStream, setLiveStream] = useState({});
  const [snapshots, setSnapshots] = useState({});
  const [loading, setLoading] = useState({});
  const [newCam, setNewCam] = useState({ name: '', source: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [fullscreenCam, setFullscreenCam] = useState(null);

  // ── Status Polling ──────────────────────────────────────────────────────────
  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ai/status');
      const data = await res.json();
      setActiveStatus(data.activeCameras || {});
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Socket — frame buffer to avoid React flooding ───────────────────────────
  const frameRef = useRef({});

  useEffect(() => {
    if (!socket) return;
    socket.on('stream_frame', (data) => {
      frameRef.current[data.cameraId] = data.frame;
    });
    // Flush to state at ~12 fps — smooth enough, avoids lag
    const flush = setInterval(() => {
      if (Object.keys(frameRef.current).length > 0) {
        setLiveStream(prev => ({ ...prev, ...frameRef.current }));
      }
    }, 83);
    return () => { socket.off('stream_frame'); clearInterval(flush); };
  }, [socket]);

  // ── Alert snapshot ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (alerts.length > 0 && alerts[0].event_id?.image_snapshot) {
      const loc = alerts[0].event_id.location;
      setSnapshots(prev => ({ ...prev, [loc]: alerts[0].event_id.image_snapshot }));
    }
  }, [alerts]);

  // ── Toggle AI ───────────────────────────────────────────────────────────────
  const toggleAI = async (cameraId, source, isOnline) => {
    setLoading(prev => ({ ...prev, [cameraId]: true }));
    try {
      await fetch('http://localhost:5000/api/ai/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ action: isOnline ? 'stop' : 'start', cameraId, source }),
      });
      // Clear stale stream when stopping
      if (isOnline) setLiveStream(prev => { const n = { ...prev }; delete n[cameraId]; return n; });
      setTimeout(fetchStatus, 1500);
    } catch (e) { console.error(e); }
    setLoading(prev => ({ ...prev, [cameraId]: false }));
  };

  // ── Add Camera ──────────────────────────────────────────────────────────────
  const handleAddCamera = () => {
    if (!newCam.name || !newCam.source) return;
    setCameras(prev => [...prev, { id: `CAM-${prev.length + 1}`, ...newCam }]);
    setNewCam({ name: '', source: '' });
    setShowAdd(false);
  };

  // ── ESC key ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setFullscreenCam(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Reusable Feed image ─────────────────────────────────────────────────────
  const FeedContent = ({ camId, large = false }) => {
    const frame = liveStream[camId] || snapshots[camId];
    if (!frame) return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-3 animate-pulse">
        <Activity className={`${large ? 'w-16 h-16' : 'w-10 h-10'} text-primary`} />
        <p className={`font-black text-primary uppercase tracking-widest ${large ? 'text-xs' : 'text-[9px]'}`}>
          Connecting to camera...
        </p>
      </div>
    );
    return (
      <img
        src={frame}
        className={`w-full h-full ${large ? 'object-contain' : 'object-cover'}`}
        alt={`${camId} Feed`}
      />
    );
  };

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-4">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-primary" /> Camera Dashboard
          </h2>
          <p className="text-slate-400 font-medium tracking-tight">Managing camera security system</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.03]"
        >
          <Plus className="w-5 h-5" /> Add New Camera
        </button>
      </div>

      {/* ── Add Camera Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="glass-card w-full max-w-md rounded-[2.5rem] p-8 relative">
            <button onClick={() => setShowAdd(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-black text-white mb-7 pr-10">Add New Camera</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location Label</label>
                <input type="text" placeholder="e.g. North Perimeter"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-primary/60 transition-all text-sm"
                  value={newCam.name} onChange={e => setNewCam({ ...newCam, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Camera Source</label>
                <input type="text" placeholder="0 = webcam, or RTSP URL"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-primary/60 transition-all font-mono text-sm"
                  value={newCam.source} onChange={e => setNewCam({ ...newCam, source: e.target.value })} />
              </div>
              <button onClick={handleAddCamera}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 mt-2">
                Add Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Modal ── */}
      {fullscreenCam && (() => {
        const isOn = activeStatus[fullscreenCam.id] === 'ONLINE';
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}
          >
            {/* Topbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.6)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isOn && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.8)', color: '#fff', fontSize: 10, padding: '3px 10px', borderRadius: 999, fontWeight: 900, letterSpacing: '0.1em' }}>
                    <Radio style={{ width: 10, height: 10 }} /> LIVE
                  </span>
                )}
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>{fullscreenCam.name}</span>
                <span style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 8 }}>{fullscreenCam.id}</span>
              </div>
              <button onClick={() => setFullscreenCam(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                <Minimize2 style={{ width: 16, height: 16 }} /> Exit Fullscreen
              </button>
            </div>
            {/* Feed */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#050508' }}>
              <FeedContent camId={fullscreenCam.id} large />
              <div style={{ position: 'absolute', bottom: 16, left: 20, color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 8 }}>
                SRC: {fullscreenCam.source}  |  ESC to close
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Camera Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {cameras.map(cam => {
          const isOnline = activeStatus[cam.id] === 'ONLINE';
          const isLoad = loading[cam.id];
          const hasFrame = !!(liveStream[cam.id] || snapshots[cam.id]);

          return (
            <div key={cam.id} className="glass-card rounded-[2.5rem] overflow-hidden group border-white/5 hover:border-white/10 transition-all duration-500 shadow-2xl">
              {/* Card Header */}
              <div className="p-5 flex justify-between items-center bg-white/[0.02] border-b border-white/5">
                <div>
                  <h3 className="font-black text-base text-white tracking-tight flex items-center gap-3">
                    {cam.name}
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-mono">{cam.id}</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Fullscreen */}
                  {isOnline && hasFrame && (
                    <button onClick={() => setFullscreenCam(cam)}
                      className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" title="Fullscreen (F)">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  )}
                  {/* Power */}
                  <button
                    onClick={() => toggleAI(cam.id, cam.source, isOnline)}
                    disabled={isLoad}
                    className={`p-3 rounded-2xl transition-all shadow-xl ${isOnline
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-primary/20 text-primary hover:bg-primary/30'}`}>
                    <Power className={`w-5 h-5 ${isLoad ? 'animate-spin' : ''}`} />
                  </button>
                  {/* Remove */}
                  <button onClick={() => setCameras(cameras.filter(c => c.id !== cam.id))}
                    className="p-3 rounded-2xl bg-white/5 text-slate-500 hover:text-red-400 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feed Window */}
              <div className="relative aspect-video bg-black/70 overflow-hidden">
                {isOnline ? (
                  <FeedContent camId={cam.id} />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full opacity-20">
                    <Shield className="w-16 h-16 mb-3 text-slate-500" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Camera Offline</p>
                  </div>
                )}
                {/* LIVE badge */}
                {isOnline && (
                  <div className="absolute top-4 left-4">
                    <div className="bg-red-600/80 backdrop-blur-md text-white text-[9px] px-3 py-1 rounded-full font-black tracking-widest flex items-center gap-2">
                      <Radio className="w-3 h-3 animate-pulse" /> LIVE
                    </div>
                  </div>
                )}
                {/* Fullscreen shortcut overlay on hover */}
                {isOnline && hasFrame && (
                  <button onClick={() => setFullscreenCam(cam)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20">
                    <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-2 text-white text-xs font-bold">
                      <Maximize2 className="w-4 h-4" /> Click to Fullscreen
                    </div>
                  </button>
                )}
                <div className="absolute bottom-3 left-3 text-white text-[9px] font-mono opacity-30 bg-black/50 px-2 py-1 rounded-lg">
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
