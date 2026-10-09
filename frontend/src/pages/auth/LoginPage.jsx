import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, UserCheck, ShieldCheck, Boxes, UserPlus, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [email, setEmail] = useState('officer@udrrms.com');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regEmergencyContact, setRegEmergencyContact] = useState('');

  const { login, register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      const user = await login(email, password);
      success(`Authenticated: Welcome ${user.fullName}`);

      if (user.roleName === 'CITIZEN') {
        navigate('/citizen/dashboard');
      } else if (user.roleName === 'DISASTER_OFFICER' || user.roleName === 'COMMAND_CENTER') {
        navigate('/officer/dashboard');
      } else if (user.roleName === 'COORDINATOR' || user.roleName === 'RESOURCE_PROVIDER') {
        navigate('/coordinator/dashboard');
      } else {
        navigate('/officer/dashboard');
      }
    } catch (err) {
      error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regFullName) return;

    setSubmitting(true);
    try {
      const registered = await register({
        full_name: regFullName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        role_name: 'CITIZEN',
        address: regAddress,
        emergency_contact: regEmergencyContact
      });
      success(`Account created! Welcome ${regFullName}`);
      navigate('/citizen/dashboard');
    } catch (err) {
      error(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail) => {
    setEmail(quickEmail);
    setPassword('password123');
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 mb-3 shadow-lg shadow-rose-500/5">
            <ShieldAlert className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-sans">
            UDRRMS
          </h1>
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mt-1">
            Urban Disaster Relief & Resource Management System
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            13-Stage Sequential Disaster Response • Relational Oracle Database • Multi-Agency Operations
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tactical Access (Sign In)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Citizen Registration
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="officer@udrrms.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-600/20 text-sm"
              >
                <span>{submitting ? 'Verifying Credentials...' : 'Authenticate & Enter System'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="ramesh@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Residential Address (Ward / Locality)
                </label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="e.g. 5th Cross, Hebbal Ward 21"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    value={regEmergencyContact}
                    onChange={(e) => setRegEmergencyContact(e.target.value)}
                    placeholder="+91-9800000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Create Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500 text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-rose-600/20 text-sm"
              >
                <span>{submitting ? 'Creating Citizen Profile...' : 'Complete Registration'}</span>
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Switcher - 3 Main Master Roles */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Select Role Persona (1-Click Test Access)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('citizen@udrrms.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-emerald-500/50 transition-all group"
              >
                <UserCheck className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-200">Role 1: Citizen</span>
                <span className="text-[9px] text-slate-500 font-mono">Aarav Sharma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('officer@udrrms.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-rose-500/50 transition-all group"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-200">Role 2: Officer</span>
                <span className="text-[9px] text-slate-500 font-mono">Col. Rajesh Varma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('coordinator@udrrms.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
              >
                <Boxes className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-200">Role 3: Logistics</span>
                <span className="text-[9px] text-slate-500 font-mono">Dr. Suresh Hegde</span>
              </button>
            </div>
          </div>
        </div>

        {/* Target Oracle DB Footer Tag */}
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 mt-4 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Oracle Database 21c (Enterprise 3NF Schema) • FastAPI Engine</span>
        </div>
      </div>
    </div>
  );
}
