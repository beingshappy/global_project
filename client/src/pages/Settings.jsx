import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Sliders, Save, BellRing, Database, Cpu, Shield, Globe, Lock, Zap, Download, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Settings = () => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [purging, setPurging] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    confidence: 75,
    deepFace: true,
    lowLight: true,
    webSocket: true
  });

  // Fetch settings from Backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/config', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load system config:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchConfig();
  }, [token]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await axios.post('http://localhost:5000/api/config', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(false), 3000);
    }
  };

  const handlePurge = async () => {
    if (!window.confirm('WARNING: THIS WILL PERMANENTLY DELETE ALL SECURITY LOGS. PROCEED?')) return;
    setPurging(true);
    try {
      await axios.delete('http://localhost:5000/api/events/purge', {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('System purge successful. Records cleared.');
    } catch (err) {
      console.error(err);
      alert('Purge failed.');
    } finally {
      setPurging(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get('http://localhost:5000/api/events/export', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const events = res.data;
      
      const doc = new jsPDF();
      doc.setFillColor(2, 6, 23); 
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('WOMEN SAFETY ANALYTICS - SECURITY REPORT', 14, 25);
      doc.setFontSize(10);
      doc.text(`Total Historical Logs: ${events.length}`, 14, 33);

      const tableData = events.map(ev => [
        `ID-${ev._id.slice(-6).toUpperCase()}`,
        `${new Date(ev.timestamp).toLocaleDateString()} ${new Date(ev.timestamp).toLocaleTimeString()}`,
        ev.location,
        ev.risk_type.replace(/_/g, ' '),
        `${(ev.confidence_score * 100).toFixed(0)}%`
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['ID', 'Timestamp', 'Location', 'Risk Category', 'Conf.']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }
      });

      if (events.some(e => e.image_snapshot)) {
        doc.addPage();
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.text('RECOVERED EVIDENCE SNAPSHOTS', 14, 20);
        let x = 14, y = 30, count = 0;
        events.forEach(ev => {
          if (ev.image_snapshot && count < 4) {
             try {
               doc.addImage(ev.image_snapshot, 'JPEG', x, y, 90, 65);
               x += 100;
               if (x > 150) { x = 14; y += 75; }
               count++;
             } catch(e) {}
          }
        });
      }

      doc.save(`SENTINEL_FULL_AUDIT_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing with Neural Core...</p>
    </div>
  );

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-4">
             <Sliders className="w-8 h-8 md:w-10 md:h-10 text-primary" /> Settings
          </h2>
          <p className="text-slate-400 font-medium tracking-tight">Manage your account and system behavior</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl hover:scale-[1.03] active:scale-95 ${
            saveStatus === 'success' ? 'bg-green-500 text-white shadow-green-500/20' : 
            saveStatus === 'error' ? 'bg-danger text-white shadow-danger/20' : 
            'bg-primary text-white shadow-primary/20 hover:bg-primary/90'
          }`}
        >
          {saveStatus === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
           saveStatus === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
           <Save className="w-5 h-5" />}
          
          {saveStatus === 'saving' ? 'Committing...' : 
           saveStatus === 'success' ? 'Settings Applied' : 
           saveStatus === 'error' ? 'Sync Failed' : 
           'Commit Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module Settings */}
        <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 space-y-8 md:space-y-10">
          <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
            <Cpu className="w-5 h-5 md:w-6 md:h-6 text-primary" /> AI Engine Configuration
          </h3>
          
          <div className="space-y-8 text-slate-300">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Detection Confidence</label>
                <div className="text-primary font-mono text-sm font-bold bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{settings.confidence / 100}</div>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={settings.confidence}
                onChange={(e) => setSettings({...settings, confidence: parseInt(e.target.value)})}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary" 
              />
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => setSettings({...settings, deepFace: !settings.deepFace})}>
              <div>
                <p className="text-white font-bold text-sm tracking-tight">DeepFace Classification</p>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Multi-modal demographics</p>
              </div>
              <input type="checkbox" checked={settings.deepFace} readOnly className="w-6 h-6 accent-primary rounded-lg bg-obsidian border-white/10" />
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => setSettings({...settings, lowLight: !settings.lowLight})}>
              <div>
                <p className="text-white font-bold text-sm tracking-tight">Low Light Enhancer</p>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Histogram Equilization</p>
              </div>
              <input type="checkbox" checked={settings.lowLight} readOnly className="w-6 h-6 accent-primary rounded-lg bg-obsidian border-white/10" />
            </div>
          </div>
        </div>

        {/* Global Config */}
        <div className="glass-card rounded-[2.5rem] p-10 space-y-10">
          <h3 className="text-xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
            <BellRing className="w-6 h-6 text-secondary" /> Alerts & Notifications
          </h3>
          
          <div className="space-y-6 text-slate-300">
            <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => setSettings({...settings, webSocket: !settings.webSocket})}>
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-secondary/10 rounded-2xl"><Globe className="w-5 h-5 text-secondary" /></div>
                 <div>
                    <p className="text-white font-bold text-sm tracking-tight">WebSocket Streams</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Real-time socket sync</p>
                 </div>
              </div>
              <input type="checkbox" checked={settings.webSocket} readOnly className="w-6 h-6 accent-secondary rounded-lg bg-obsidian border-white/10" />
            </div>

            <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 opacity-40">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-800 rounded-2xl"><Lock className="w-5 h-5 text-slate-500" /></div>
                 <div>
                    <p className="text-slate-400 font-bold text-sm tracking-tight italic">SMS Gateway Integration</p>
                    <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mt-1">Premium node feature</p>
                 </div>
              </div>
              <Lock className="w-4 h-4 text-slate-700" />
            </div>
            
            <div className="pt-4 space-y-4">
              <button 
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center justify-center w-full gap-3 px-6 py-5 bg-white/5 hover:bg-white/10 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
              >
                <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                {exporting ? 'Generating Report...' : 'Download Full Audit PDF'}
              </button>

              <button 
                onClick={handlePurge}
                disabled={purging}
                className="flex justify-center items-center w-full px-6 py-5 bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 rounded-3xl transition-all font-black text-[10px] uppercase tracking-[0.2em] group disabled:opacity-50"
              >
                <Trash2 className={`w-4 h-4 mr-3 ${purging ? 'animate-pulse' : 'group-hover:animate-bounce'}`} />
                {purging ? 'Clearing Buffer...' : 'Clear All Logs'}
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Settings;
