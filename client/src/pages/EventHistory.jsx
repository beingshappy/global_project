import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Users, Filter, History as HistoryIcon, Download, Trash2, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EventHistory = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/events', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchEvents();
  }, [token]);

  // Sort Logic
  const sortedEvents = useMemo(() => {
    let sortableItems = [...events];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [events, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this neural log?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(events.filter(ev => ev._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete event.');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42); // obsidian
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('SENTINEL AI - SAFETY REPORT', 14, 25);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);
    doc.text(`Total Records: ${events.length}`, 160, 33);

    // Summary Stats
    const highRisk = events.filter(e => e.risk_type.includes('SOS') || e.risk_type.includes('HIGH')).length;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text('Summary Analysis', 14, 50);
    doc.setFontSize(10);
    doc.text(`- High Severity Alerts: ${highRisk}`, 14, 57);
    doc.text(`- Normal Monitoring: ${events.length - highRisk}`, 14, 62);

    const tableData = sortedEvents.map(ev => [
      `ID-${ev._id.slice(-6).toUpperCase()}`,
      `${new Date(ev.timestamp).toLocaleDateString()}\n${new Date(ev.timestamp).toLocaleTimeString()}`,
      ev.location,
      ev.risk_type.replace(/_/g, ' '),
      `${(ev.confidence_score * 100).toFixed(0)}%`,
      `W:${ev.women_count} M:${ev.men_count}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['ID', 'Timestamp', 'Location', 'Alert Type', 'Conf.', 'People']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        3: { fontStyle: 'bold' }
      }
    });

    // Add Images section (if they exist)
    let finalY = 0;
    try {
      finalY = doc.lastAutoTable.finalY + 20;
    } catch (e) { finalY = 150; }
    if (sortedEvents.some(e => e.image_snapshot) && finalY < 240) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('AERIAL SNAPSHOT RECOVERY', 14, 20);
      
      let xPos = 14;
      let yPos = 30;
      let count = 0;

      sortedEvents.forEach((ev) => {
        if (ev.image_snapshot && count < 6) { // Limit to 6 snapshots for size
          try {
            doc.addImage(ev.image_snapshot, 'JPEG', xPos, yPos, 80, 60);
            doc.setFontSize(8);
            doc.text(`Ref: ${ev._id.slice(-6)} | ${ev.location}`, xPos, yPos + 65);
            
            xPos += 95;
            if (xPos > 150) {
              xPos = 14;
              yPos += 80;
            }
            count++;
          } catch (e) { console.error('Image error', e); }
        }
      });
    }

    doc.save(`SENTINEL_SECURITY_REPORT_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-4">
             <HistoryIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" /> Event History
          </h2>
          <p className="text-slate-400 font-medium tracking-tight">Post-event analytical audit trail</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={generatePDF}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-30"
          >
            <Download className="w-4 h-4" /> Export PDF Report
          </button>
          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 w-full sm:w-auto overflow-x-auto">
            <button 
              onClick={() => requestSort('timestamp')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortConfig.key === 'timestamp' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
            >
              Recent
            </button>
            <button 
              onClick={() => requestSort('confidence_score')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortConfig.key === 'confidence_score' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
            >
              Certainty
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Activity Cards */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="p-24 text-center">
            <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          sortedEvents.map((ev) => (
            <div key={ev._id} className="glass-card p-6 rounded-[2.5rem] border border-white/5 space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-2xl">
                    <Calendar className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm tracking-tight">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-slate-500 text-[10px] font-mono">{new Date(ev.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current transition-all ${
                  ev.risk_type.includes('SOS') || ev.risk_type.includes('HIGH')
                  ? 'bg-danger/10 text-danger border-danger/20' 
                  : 'bg-primary/10 text-primary border-primary/20'
                }`}>
                  {ev.risk_type.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</span>
                  <span className="text-white text-xs font-bold">{ev.location}</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Certainty</span>
                      <span className="text-primary text-xs font-mono font-bold">{(ev.confidence_score * 100).toFixed(0)}%</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                    <Users className="w-4 h-4 text-pink-400 opacity-70" />
                    <span className="text-white text-xs font-bold font-mono">W:{ev.women_count}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                    <Users className="w-4 h-4 text-blue-400 opacity-70" />
                    <span className="text-white text-xs font-bold font-mono">M:{ev.men_count}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(ev._id)}
                  className="p-3 text-danger/60 hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop-Only Table Container */}
      <div className="hidden lg:block glass-card rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10">
          <div className="min-w-full lg:min-w-[1000px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-6 md:px-8 py-6 cursor-pointer hover:text-white" onClick={() => requestSort('_id')}>Incident Node</th>
                  <th className="px-6 md:px-8 py-6 cursor-pointer hover:text-white flex items-center gap-2" onClick={() => requestSort('timestamp')}>
                    Chronology / Location
                    {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </th>
                  <th className="px-6 md:px-8 py-6">Intelligence Class</th>
                  <th className="px-6 md:px-8 py-6">Certainty</th>
                  <th className="px-6 md:px-8 py-6">Human Count</th>
                  <th className="px-6 md:px-8 py-6 text-right pr-6 md:pr-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-24 text-center">
                      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : (
                  sortedEvents.map((ev) => (
                    <tr key={ev._id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 md:px-8 py-7">
                        <span className="text-primary font-mono text-[10px] font-bold bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/10">
                          ID-{ev._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-6">
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="p-2 bg-white/5 rounded-xl mt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm tracking-tight">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-slate-500 text-[10px] font-mono mt-0.5">{new Date(ev.timestamp).toLocaleDateString()} @ {ev.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current transition-all ${
                          ev.risk_type.includes('SOS') || ev.risk_type.includes('HIGH')
                          ? 'bg-danger/10 text-danger border-danger/20' 
                          : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {ev.risk_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-16 md:w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${ev.confidence_score * 100}%` }}></div>
                          </div>
                          <span className="text-white font-mono text-xs">{(ev.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-all">
                            <Users className="w-4 h-4 text-pink-400 opacity-70" />
                            <span className="text-white text-xs font-bold font-mono">W:{ev.women_count}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-all">
                            <Users className="w-4 h-4 text-blue-400 opacity-70" />
                            <span className="text-white text-xs font-bold font-mono">M:{ev.men_count}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-6 text-right pr-6 md:pr-12">
                        <button 
                          onClick={() => handleDelete(ev._id)}
                          className="p-3 text-slate-600 hover:text-danger hover:bg-danger/10 rounded-xl transition-all border border-transparent hover:border-danger/10"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && events.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-24 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <HistoryIcon className="w-16 h-16 mb-4 text-slate-500" />
                        <p className="text-lg font-black uppercase tracking-widest text-slate-500">Archival Buffer Empty</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventHistory;
