import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, Users, Building2, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const POPULAR_SEARCHES = ['React Developer', 'Data Scientist', 'UI/UX Designer', 'Backend Engineer', 'Product Manager', 'DevOps'];

const CAPABILITIES = [
  { icon: Sparkles, label: 'Gemini AI Match Engine' },
  { icon: Briefcase, label: 'Internal Portal Listings' },
  { icon: Building2, label: 'Adzuna External Discovery' },
  { icon: Users, label: 'Student & Recruiter Roles' },
];

const FEATURES = [
  { title: 'Smart Job Matching', desc: 'AI-powered recommendations based on your skills and profile.' },
  { title: 'Real-time Notifications', desc: 'Get instant alerts when your application status changes.' },
  { title: 'Resume Analyzer', desc: 'Upload your resume and get recruiter-style AI feedback.' },
  { title: 'Direct Application', desc: 'Apply in one click with your saved profile.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (location) params.set('location', location);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-12 right-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm mb-6 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              AI-Powered Job Discovery & Career Matching
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
              Find Your Dream Job<br />
              <span className="text-indigo-300">Land It With Confidence</span>
            </h1>
            <p className="text-lg text-indigo-200 mb-10 max-w-xl mx-auto">
              Connect with top companies, upload your resume, and get placed faster than ever.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl max-w-2xl mx-auto">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, skills, company..."
                  className="flex-1 text-gray-900 placeholder-gray-400 outline-none text-sm py-2"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 px-3 sm:border-l border-gray-200">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state or remote"
                  className="flex-1 text-gray-900 placeholder-gray-400 outline-none text-sm py-2"
                />
              </div>
              <button type="submit" className="btn-primary whitespace-nowrap sm:px-6 rounded-xl">
                Search Jobs
              </button>
            </form>

            {/* Popular searches */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="text-sm text-indigo-300">Popular:</span>
              {POPULAR_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(s)}`)}
                  className="text-sm text-white/80 hover:text-white underline underline-offset-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
              <Link to="/jobs" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-semibold shadow-sm hover:bg-gray-50 transition-colors">
                Explore Jobs <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose JobNexus?</h2>
          <p className="text-gray-500 mt-3">Everything you need to accelerate your career journey</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-6">
              <CheckCircle className="w-8 h-8 text-primary-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">Join thousands of students finding their dream jobs every day.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary px-8 py-3 text-base rounded-xl">
              Create Free Account
            </Link>
            <Link to="/jobs" className="btn-secondary px-8 py-3 text-base rounded-xl flex items-center justify-center gap-2 bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700">
              Browse Jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
