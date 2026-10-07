import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, ShieldCheck, Truck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@udrorp.com');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.fullName}`);

      if (user.roleName === 'COMMAND_CENTER') {
        navigate('/command/dashboard');
      } else if (user.roleName === 'FIELD_RESPONDER') {
        navigate('/responder/dashboard');
      } else if (user.roleName === 'RESOURCE_PROVIDER') {
        navigate('/provider/dashboard');
      } else {
        navigate('/command/dashboard');
      }
    } catch (err) {
      error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail) => {
    setEmail(quickEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 mb-4 shadow-lg shadow-rose-500/5">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">
            UDR-ORP
          </h1>
          <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mt-1">
            Urban Disaster Response Platform
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            Centralized Emergency Incident Coordination, Asset Allocation & Field Operations
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@udrorp.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-brand-600/20 text-sm"
            >
              <span>{submitting ? 'Verifying Credentials...' : 'Authenticate & Enter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@udrorp.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 transition-all group"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-300">Command</span>
                <span className="text-[9px] text-slate-500 font-mono">admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('responder@udrorp.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 transition-all group"
              >
                <Users className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-300">Responder</span>
                <span className="text-[9px] text-slate-500 font-mono">responder</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('provider@udrorp.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 transition-all group"
              >
                <Truck className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-slate-300">Provider</span>
                <span className="text-[9px] text-slate-500 font-mono">provider</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Database Tag */}
        <p className="text-center text-[11px] text-slate-600 mt-6 font-mono">
          Connected to Oracle Database 21c/XE • Secure RBAC Auth
        </p>
      </div>
    </div>
  );
}
