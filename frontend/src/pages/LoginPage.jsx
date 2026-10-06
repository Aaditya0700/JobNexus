import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Briefcase, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'recruiter') navigate('/recruiter');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Brand Panel */}
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white p-10 relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-6">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">JobNexus</h1>
          <p className="text-indigo-200 mt-2 text-sm">AI-Powered Job Discovery & Career Matching</p>
          <p className="text-indigo-100/80 text-sm mt-6 leading-relaxed">
            Sign in to browse internal listings, discover Adzuna-powered external roles, and run your
            Gemini AI match analysis.
          </p>
        </div>

        {/* Form Panel */}
        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-gray-900">Sign in to JobNexus</h2>
          <p className="text-gray-500 mt-1 mb-6 text-sm">Welcome back — enter your credentials to continue.</p>

          <div className="card border-0 shadow-none p-0">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="••••••••"
                    className="input-field pr-10"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                  Create one
                </Link>
              </p>
            </div>

            {/* Demo credentials */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-800 mb-1">Demo Credentials</p>
              <div className="text-xs text-amber-700 space-y-0.5">
                <p>Student: student@demo.com / password123</p>
                <p>Recruiter: recruiter@demo.com / password123</p>
                <p>Admin: admin@demo.com / password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}