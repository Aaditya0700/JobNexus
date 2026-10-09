import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Briefcase, Eye, EyeOff, Loader2, GraduationCap, Building2 } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const data = await register(form);
      toast.success(`Welcome, ${data.user.name}! Account created.`);
      navigate(data.user.role === 'recruiter' ? '/recruiter' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-slate-50">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden animate-fade-up">
        {/* Brand Panel */}
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white p-10 relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-6">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">JobNexus</h1>
          <p className="text-indigo-200 mt-2 text-sm">AI-Powered Job Discovery & Career Matching</p>
          <p className="text-indigo-100/80 text-sm mt-6 leading-relaxed">
            Create an account to browse internal listings, discover Adzuna-powered external roles, and run
            your Gemini AI match analysis.
          </p>
        </div>

        {/* Form Panel */}
        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-500 mt-1 mb-6 text-sm">Join JobNexus and let AI find your next role.</p>

          <div className="card border-0 shadow-none p-0">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student', label: 'Student / Job Seeker', Icon: GraduationCap },
                  { value: 'recruiter', label: 'Recruiter / Employer', Icon: Building2 },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      form.role === value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${form.role === value ? 'text-primary-600' : 'text-gray-400'}`} />
                    <p className={`text-xs font-medium ${form.role === value ? 'text-primary-700' : 'text-gray-600'}`}>{label}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="input-field pr-10"
                    required
                  />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}