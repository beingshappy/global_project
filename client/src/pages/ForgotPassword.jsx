import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (pass.length > 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(formData.newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Secure', 'Indestructible'];
  const strengthColors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-primary', 'bg-primary'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (strength < 2) {
      setError('New password is too weak');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/reset-insecure', {
        email: formData.email,
        newPassword: formData.newPassword
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-obsidian text-white">
        <div className="glass-card p-12 rounded-[3rem] text-center max-w-md animate-in zoom-in-95 duration-500">
           <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
           </div>
           <h2 className="text-3xl font-black mb-4 tracking-tight">Access Restored</h2>
           <p className="text-slate-400 font-medium mb-8">Your security credentials have been updated. Redirecting to login...</p>
           <Link to="/login" className="text-primary font-bold hover:underline">Click here if not redirected</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-obsidian">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-danger/10 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-danger/10 rounded-2xl neon-border-danger mb-6">
            <Lock className="w-12 h-12 text-danger" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Account Recovery</h1>
          <p className="text-slate-400 font-medium">Reset your administrative passphrase</p>
        </div>

        <div className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-danger to-transparent opacity-50"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Account Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-danger transition-colors" />
                <input
                  type="email"
                  placeholder="admin@safewoman.ui"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-danger/50 focus:ring-4 focus:ring-danger/10 transition-all font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-danger transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-danger/50 focus:ring-4 focus:ring-danger/10 transition-all"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                />
              </div>
              
              {formData.newPassword && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Security:</span>
                    <span className={strengthColors[strength].replace('bg-', 'text-')}>{strengthLabels[strength]}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className={`h-full flex-1 transition-all duration-500 ${i < strength ? strengthColors[strength] : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white placeholder-slate-600 focus:outline-none focus:border-danger/50 focus:ring-4 focus:ring-danger/10 transition-all font-medium"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-danger hover:bg-danger/90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-danger/20 flex items-center justify-center gap-2 group transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 disabled:opacity-50"
            >
              {loading ? 'Updating Security...' : 'Reset Password Now'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
            Remembered? <Link to="/login" className="text-danger hover:underline ml-1">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
