import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, Users, Building2, Sparkles, ArrowRight, CheckCircle, Shield, FileSearch } from 'lucide-react';

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

const AI_TOOLS = [
  {
    icon: FileSearch,
    title: 'Resume Analyzer',
    desc: 'Score your resume the way a recruiter and ATS would, with section feedback and keyword gaps.',
    to: '/resume-analyzer',
    cta: 'Open analyzer',
  },
  {
    icon: Sparkles,
    title: 'Job Match Analysis',
    desc: 'Compare your resume against a listing to see matching skills, missing requirements, and a match score.',
    to: '/jobs',
    cta: 'Browse jobs to match',
  },
  {
    icon: Shield,
    title: 'Job Trust',
    desc: 'Review credibility signals and caution notes on internal and Adzuna listings before you apply.',
    to: '/jobs',
    cta: 'Review listings',
  },
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
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-slate-950" />
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-12 right-0 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6 border border-white/15 motion-enter">
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              AI-Powered Job Discovery & Career Matching
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-tight mb-5 tracking-tight motion-enter motion-delay-1">
              Find your next role.<br />
              <span className="text-indigo-200">Apply with clearer insight.</span>
            </h1>
            <p className="text-base sm:text-lg text-indigo-100/85 mb-10 max-w-xl mx-auto motion-enter motion-delay-2">
              Search JobNexus listings and Adzuna-powered opportunities, then use Gemini AI to review your resume and match it to a job.
            </p>

            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-xl max-w-2xl mx-auto motion-enter motion-delay-3">
              <div className="flex items-center gap-2 flex-1 min-w-0 px-3">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, skills, company..."
                  className="flex-1 min-w-0 text-slate-900 placeholder-slate-400 outline-none text-sm py-2.5"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 px-3 sm:border-l border-slate-200">
                <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state or remote"
                  className="flex-1 min-w-0 text-slate-900 placeholder-slate-400 outline-none text-sm py-2.5"
                />
              </div>
              <button type="submit" className="btn-primary whitespace-nowrap sm:px-6 rounded-xl">
                Search Jobs
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-2 mt-6 motion-enter motion-delay-4">
              <span className="text-sm text-indigo-200">Popular:</span>
              {POPULAR_SEARCHES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(s)}`)}
                  className="text-sm text-white/80 hover:text-white underline underline-offset-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10 motion-enter motion-delay-5">
              <Link to="/jobs" className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-white text-primary-700 font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                Explore Jobs <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200/80 shadow-card p-4 text-center min-w-0">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-sm font-medium text-slate-900 break-anywhere">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">AI tools built into JobNexus</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
            These features use your uploaded resume and live job data. Sign in as a student to run analysis.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {AI_TOOLS.map(({ icon: Icon, title, desc, to, cta }) => (
            <Link key={title} to={to} className="card-hover group flex flex-col p-6">
              <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 flex-1">{desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 mt-4 group-hover:gap-2 transition-all">
                {cta} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Why Choose JobNexus?</h2>
            <p className="text-slate-500 mt-3">Tools for students and recruiters in one place</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-200/80 p-6 hover:border-slate-300 hover:shadow-card transition-all">
                <CheckCircle className="w-7 h-7 text-primary-600 mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8">Create an account to apply, post jobs, or run AI analysis on your resume.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary px-8 py-3 text-base rounded-xl">
              Create Free Account
            </Link>
            <Link to="/jobs" className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base rounded-xl bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-colors">
              Browse Jobs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
