import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { AlertTriangle, Clock, MapPin, Users, Activity, ShieldCheck, Zap, History as HistoryIcon } from 'lucide-react';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [activeNodeCount, setActiveNodeCount] = useState(0);
  const { alerts } = useContext(SocketContext);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, statusRes] = await Promise.all([
          axios.get('http://localhost:5000/api/events', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/ai/status', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setEvents(eventRes.data);
        
        // Calculate active nodes from backend response
        const activeCams = statusRes.data.activeCameras || {};
        setActiveNodeCount(Object.keys(activeCams).length);
      } catch (err) {
        console.error('Core sync failure:', err);
      }
    };
    if (token) fetchData();
  }, [token]);

  const stats = [
    { name: 'Active Nodes', value: activeNodeCount.toString(), icon: Activity, color: 'text-primary' },
    { name: 'Total Detections', value: events.length.toString(), icon: ShieldCheck, color: 'text-success' },
    { name: 'Live Threats', value: alerts.length.toString(), icon: AlertTriangle, color: 'text-danger' },
    { name: 'System Pulse', value: activeNodeCount > 0 ? 'Tactical' : 'Standby', icon: Zap, color: 'text-secondary' },
  ];

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">Security Overview</h2>
          <p className="text-slate-400 font-medium">Real-time surveillance & threat analysis gateway</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-success/10 border border-success/20 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-success text-sm font-bold uppercase tracking-widest">Enclave Secured</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-4 md:p-6 rounded-[2rem] flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-5 transition-transform hover:scale-[1.03] duration-300 group">
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 ${stat.color} group-hover:neon-border-primary transition-all`}>
              <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.name}</p>
              <p className="text-lg md:text-2xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live Alerts Area */}
      {alerts.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-1.5 bg-danger/10 border border-danger/20 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger animate-ping"></span>
              <span className="text-danger text-[10px] font-black uppercase tracking-[0.2em]">Active Violations</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-danger/20 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {alerts.map((alert, i) => (
              <div key={i} className="glass-card rounded-[2.5rem] p-4 relative overflow-hidden group hover:neon-border-danger transition-all duration-500">
                {/* Snapshot Image */}
                {alert.event_id?.image_snapshot ? (
                   <div className="aspect-video rounded-[2rem] overflow-hidden mb-6 relative">
                     <img src={alert.event_id.image_snapshot} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-700" alt="Snapshot" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/20 uppercase tracking-widest">
                         Live Snapshot
                      </div>
                   </div>
                ) : (
                  <div className="aspect-video rounded-[2rem] bg-white/5 flex items-center justify-center mb-6">
                    <Activity className="w-12 h-12 text-slate-700 animate-pulse" />
                  </div>
                )}
                
                <div className="px-4 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight leading-tight">{alert.event_id?.risk_type?.replace(/_/g, ' ')}</h4>
                      <p className="text-danger font-bold text-[10px] uppercase tracking-widest mt-1">Intervention Required</p>
                    </div>
                    <div className="p-3 bg-danger/20 rounded-2xl text-danger">
                       <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm pt-4 border-t border-white/5">
                    <div className="flex items-center text-slate-400 text-xs">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-primary" /> {alert.event_id?.location}
                    </div>
                    <div className="flex items-center text-slate-400 text-xs text-right justify-end">
                      <Clock className="w-3.5 h-3.5 mr-2 text-primary" /> {new Date(alert.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section className="glass-card rounded-[3rem] overflow-hidden">
        <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-2xl font-black text-white flex items-center gap-4">
            <HistoryIcon className="w-7 h-7 text-primary" /> Recent System Logs
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Global Sequence: {events.length}</p>
        </div>
        
        {/* Mobile-Friendly Activity Feed */}
        <div className="md:hidden space-y-4">
          {events.slice(0, 10).map(ev => (
            <div key={ev._id} className="glass-card p-5 rounded-[2rem] border border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <HistoryIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-slate-500 text-[10px] font-mono">{new Date(ev.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  ev.risk_type.includes('HIGH') || ev.risk_type.includes('SOS') 
                  ? 'bg-danger/10 text-danger border-danger/20' 
                  : 'bg-primary/10 text-primary border-primary/20'
                }`}>
                  {ev.risk_type.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center text-slate-400 text-[10px]">
                  <MapPin className="w-3 h-3 mr-2 text-primary" /> {ev.location}
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-pink-400 text-[9px] font-bold">W:{ev.women_count}</span>
                   <span className="text-blue-400 text-[9px] font-bold">M:{ev.men_count}</span>
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="p-10 text-center opacity-20">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3" />
              <p className="text-xs font-black uppercase tracking-widest">No Logs Found</p>
            </div>
          )}
        </div>

        {/* Desktop-Only Table Layout */}
        <div className="hidden md:block overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10">
          <div className="min-w-[700px]">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] bg-white/[0.01]">
                  <th className="px-5 md:px-8 py-5">Activity</th>
                  <th className="px-5 md:px-8 py-5">Node Location</th>
                  <th className="px-5 md:px-8 py-5">Risk Protocol</th>
                  <th className="px-5 md:px-8 py-5">Certainty</th>
                  <th className="px-5 md:px-8 py-5 text-right">Population</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {events.slice(0, 10).map(ev => (
                  <tr key={ev._id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 md:px-8 py-6 text-white font-bold text-sm tracking-tight">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="block text-slate-500 text-[10px] font-mono mt-0.5">{new Date(ev.timestamp).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 md:px-8 py-6 text-slate-300 font-medium text-sm">{ev.location}</td>
                    <td className="px-5 md:px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        ev.risk_type.includes('HIGH') || ev.risk_type.includes('SOS') 
                        ? 'bg-danger/10 text-danger border-danger/20' 
                        : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {ev.risk_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 md:px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${ev.confidence_score * 100}%` }}></div>
                         </div>
                         <span className="text-white font-mono text-xs">{(ev.confidence_score*100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 md:px-8 py-6 text-right">
                      <div className="flex items-center gap-2 justify-end">
                         <div className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-pink-400 text-[10px] font-black">W: {ev.women_count}</span>
                         </div>
                         <div className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-blue-400 text-[10px] font-black">M: {ev.men_count}</span>
                         </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </section>
  </div>
);
};

export default Dashboard;
