import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MailCheck, Lock, Mail, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setSubmitting(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify backend is running.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoRegister = async () => {
    setError('');
    setSubmitting(true);
    const demoName = 'Demo Manager';
    const demoEmail = `user${Math.floor(Math.random() * 1000)}@emailpro.com`;
    const demoPassword = 'Password123!';

    try {
      await register(demoName, demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Quick registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme Background Video */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-25 filter blur-[1px] scale-105"
        >
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a11]/85 via-[#070a11]/70 to-[#070a11]/90" />
      </div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl z-10 relative border border-white/15 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30 border border-white/20">
            <MailCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1">
            Create Email<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Pro</span> Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">Start discovering leads & managing outbound campaigns</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl glass-badge-rose flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-2xl glass-button-primary text-white text-xs font-bold shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Register Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleQuickDemoRegister}
            disabled={submitting}
            className="w-full py-2.5 rounded-2xl glass-button-secondary text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 shadow transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Instant Demo Register & Sign In
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-300 hover:text-white font-bold underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
