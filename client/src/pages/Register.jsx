import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, User, Mail, Lock, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
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

  const strength = calculateStrength(formData.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Secure', 'Indestructible'];
  const strengthColors = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-primary', 'bg-primary'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (strength < 2) {
      setError('Password is too weak. Please use a stronger combination.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard'); // Auto-login redirect
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not establish connection to safety grid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 md:mb-10 animate-float">
          <div className="inline-flex p-3 md:p-4 bg-primary/10 rounded-2xl neon-border-primary mb-4 md:mb-6">
            <ShieldAlert className="w-10 h-10 md:w-12 md:h-12 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm md:text-base px-4">Join the Safety Administration Team</p>
        </div>

        <div className="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Security Officer 1"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium disabled:opacity-50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="name@safewoman.ui"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium disabled:opacity-50"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all disabled:opacity-50"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Strength Meter */}
              {formData.password && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Strength:</span>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group transition-all hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Initializing...
                </>
              ) : (
                <>
                  Sign Up Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
            Already have an account? <Link to="/login" className="text-primary hover:underline ml-1">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
