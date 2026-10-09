import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase, Menu, X, User, LogOut, LayoutDashboard,
  BookmarkCheck, Building2, Shield, Sparkles, ChevronDown, FileText,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const [aiToolsMobileOpen, setAiToolsMobileOpen] = useState(false);
  const aiToolsRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (aiToolsRef.current && !aiToolsRef.current.contains(e.target)) {
        setAiToolsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setAiToolsOpen(false);
    setAiToolsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const aiToolsActive = ['/resume-analyzer'].includes(location.pathname);

  const navLink = (to, label, mobile = false) => (
    <Link
      to={to}
      className={
        mobile
          ? `block rounded-lg px-3 py-2.5 text-sm font-medium min-h-[44px] ${
              isActive(to) ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          : `text-sm font-medium pb-0.5 border-b-2 transition-colors ${
              isActive(to)
                ? 'text-primary-700 border-primary-600'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`
      }
      onClick={() => setMobileOpen(false)}
    >
      {label}
    </Link>
  );

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'recruiter') return '/recruiter';
    return '/dashboard';
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">JobNexus</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 min-w-0">
            {navLink('/jobs', 'Jobs')}
            {user?.role === 'student' && (
              <>
                {navLink('/dashboard', 'Applications')}
                {navLink('/saved-jobs', 'Saved Jobs')}
                <div className="relative" ref={aiToolsRef}>
                  <button
                    type="button"
                    aria-expanded={aiToolsOpen}
                    onClick={() => setAiToolsOpen(!aiToolsOpen)}
                    className={`text-sm font-medium transition-colors pb-0.5 border-b-2 flex items-center gap-1 ${
                      aiToolsActive || aiToolsOpen
                        ? 'text-primary-700 border-primary-600'
                        : 'text-slate-600 border-transparent hover:text-slate-900'
                    }`}
                  >
                    AI Tools <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${aiToolsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {aiToolsOpen && (
                    <div className="nav-dropdown left-0 w-52">
                      <Link to="/resume-analyzer" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setAiToolsOpen(false)}>
                        <Sparkles className="w-4 h-4 text-primary-600" /> Resume Analyzer
                      </Link>
                      <Link to="/jobs" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setAiToolsOpen(false)}>
                        <FileText className="w-4 h-4 text-primary-600" /> Job Match
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
            {user?.role === 'recruiter' && (
              <>
                {navLink('/recruiter', 'Dashboard')}
                {navLink('/post-job', 'Post a Job')}
              </>
            )}
            {user?.role === 'admin' && navLink('/admin', 'Admin')}
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-auto flex-shrink-0">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  aria-expanded={dropdownOpen}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="icon-button flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 min-h-[44px]"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-200">
                    {user.profile?.profilePhoto ? (
                      <img src={user.profile.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary-700 font-semibold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-left max-w-[140px] min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="nav-dropdown right-0 w-56">
                    <Link to={getDashboardLink()} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdownOpen(false)}>
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    {user.role === 'student' && (
                      <>
                        <Link to="/saved-jobs" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdownOpen(false)}>
                          <BookmarkCheck className="w-4 h-4" /> Saved Jobs
                        </Link>
                        <Link to="/resume-analyzer" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdownOpen(false)}>
                          <Sparkles className="w-4 h-4" /> Resume Analyzer
                        </Link>
                      </>
                    )}
                    {user.role === 'recruiter' && (
                      <Link to="/company" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdownOpen(false)}>
                        <Building2 className="w-4 h-4" /> My Company
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdownOpen(false)}>
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button type="button" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors">Log in</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2 min-h-[40px]">Get Started</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="icon-button lg:hidden p-2 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div className="mobile-nav-backdrop fixed inset-0 top-16 bg-slate-900/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="mobile-nav-panel lg:hidden absolute left-0 right-0 top-16 z-50 border-t border-slate-100 bg-white px-4 py-4 space-y-1 shadow-dropdown max-h-[calc(100vh-4rem)] overflow-y-auto">
            {navLink('/jobs', 'Jobs', true)}
            {user ? (
              <>
                {user.role === 'student' && (
                  <>
                    {navLink('/dashboard', 'Applications', true)}
                    {navLink('/saved-jobs', 'Saved Jobs', true)}
                    <div>
                      <button
                        type="button"
                        onClick={() => setAiToolsMobileOpen(!aiToolsMobileOpen)}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2.5 flex items-center gap-1 w-full min-h-[44px]"
                      >
                        AI Tools <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aiToolsMobileOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {aiToolsMobileOpen && (
                        <div className="pl-4 space-y-1 border-l border-slate-100 ml-3">
                          <Link to="/resume-analyzer" className="block text-sm text-slate-600 hover:text-slate-900 py-2" onClick={() => setMobileOpen(false)}>Resume Analyzer</Link>
                          <Link to="/jobs" className="block text-sm text-slate-600 hover:text-slate-900 py-2" onClick={() => setMobileOpen(false)}>Job Match</Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {user.role === 'recruiter' && (
                  <>
                    {navLink('/recruiter', 'Dashboard', true)}
                    {navLink('/post-job', 'Post a Job', true)}
                    {navLink('/company', 'My Company', true)}
                  </>
                )}
                {user.role === 'admin' && navLink('/admin', 'Admin Panel', true)}
                {navLink('/profile', 'Profile', true)}
                <button type="button" onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-sm text-red-600 font-medium px-3 py-2.5 w-full text-left min-h-[44px]">
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Link to="/login" className="btn-secondary text-sm text-center flex-1" onClick={() => setMobileOpen(false)}>Log in</Link>
                <Link to="/register" className="btn-primary text-sm text-center flex-1" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
