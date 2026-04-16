import { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Menu } from 'lucide-react';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LiveCamera from './pages/LiveCamera';
import EventHistory from './pages/EventHistory';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import Sidebar from './components/Sidebar';

const ProtectedLayout = () => {
  const { token, loading } = useContext(AuthContext);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-obsidian flex justify-center items-center">
       <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
  
  if (!token) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-transparent text-slate-100 font-inter relative">
      <div className="noise-grain"></div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex-1 flex flex-col lg:ml-72 min-h-screen relative z-10">
        <header className="lg:hidden h-20 bg-obsidian/80 backdrop-blur-xl border-b border-white/10 flex items-center px-4 sticky top-0 z-40 transition-all">
           <button 
             onClick={() => setSidebarOpen(true)} 
             className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors border border-white/5"
           >
              <Menu className="w-6 h-6" />
           </button>
           <div className="ml-4">
              <h1 className="text-lg font-black tracking-tighter text-white uppercase leading-tight">
            Women Safety<br />
            <span className="text-primary">Analytics</span>
          </h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Mobile App v2.1</p>
           </div>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-12 animate-in fade-in duration-500">
          <SocketProvider>
            <Outlet />
          </SocketProvider>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Private Routes Wrapper */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/live" element={<LiveCamera />} />
            <Route path="/history" element={<EventHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
