import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, History as HistoryIcon, Settings, LogOut, ShieldAlert, X } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout } = useContext(AuthContext);

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Camera', path: '/live', icon: Video },
    { name: 'Event History', path: '/history', icon: HistoryIcon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-500"
          onClick={toggleSidebar}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-screen w-72 bg-obsidian/95 backdrop-blur-3xl border-r border-white/10 z-50 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-24 flex items-center justify-between px-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg neon-border-primary">
              <ShieldAlert className="text-primary w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter text-white">
              SENTINEL<span className="text-primary">AI</span>
            </h1>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 py-10 px-6 space-y-3">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Navigation</p>
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => { if(window.innerWidth < 1024) toggleSidebar(); }}
              className={({ isActive }) => 
                `flex items-center px-4 py-3.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`
              }
            >
              <link.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${isOpen ? 'animate-in fade-in duration-500' : ''}`} />
              <span className="font-medium tracking-tight text-sm">{link.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={logout}
            className="flex items-center px-4 py-3.5 text-slate-400 w-full hover:bg-danger/10 hover:text-danger rounded-xl transition-all border border-transparent hover:border-danger/20"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium text-sm">Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
