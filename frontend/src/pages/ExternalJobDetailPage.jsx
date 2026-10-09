import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MapPin, Clock, Briefcase, DollarSign, Building2,
  Globe, Share2, Loader2, ExternalLink, ChevronRight, Bookmark, BookmarkCheck,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { externalJobsAPI, savedExternalJobsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ExternalJobMatchAnalysis from '../components/job/ExternalJobMatchAnalysis';
import TrustCheck from '../components/job/TrustCheck';

export default function ExternalJobDetailPage() {
  const { externalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [externalId]);

  useEffect(() => {
    if (user?.role !== 'student' || !job) {
      setIsSaved(false);
      return;
    }
    let mounted = true;
    savedExternalJobsAPI.getAll()
      .then(({ data }) => {
        if (mounted && data?.jobs) {
          setIsSaved(data.jobs.some((j) => j.externalJobId === job.externalId));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user, job]);

  const handleToggleSave = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'student' || !job) return;
    try {
      if (isSaved) {
        await savedExternalJobsAPI.unsave(job.externalId);
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        await savedExternalJobsAPI.save({
          externalJobId: job.externalId,
          source: 'adzuna',
          title: job.title,
          company: job.company,
          location: job.location,
          redirectUrl: job.redirectUrl,
          jobType: job.jobType,
          category: job.category,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          companyLogo: job.companyLogo,
        });
        setIsSaved(true);
        toast.success('Job saved!');
      }
    } catch {
      toast.error('Failed to save job');
    }
  };

  const fetchJob = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await externalJobsAPI.getJob(externalId);
      setJob(data.job);
    } catch (error) {
      const message = error.response?.data?.message || 'Could not load this external job. Please try again.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (job) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
    if (job.salaryMin) return `From ${fmt(job.salaryMin)}`;
    return `Up to ${fmt(job.salaryMax)}`;
  };

  const handleViewOriginal = () => {
    if (job?.redirectUrl) {
      window.open(job.redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  if (!job) return (
    <div className="page-shell">
      <div role="alert" className="card max-w-xl mx-auto text-center">
        <h1 className="text-lg font-semibold text-slate-900">Unable to load external job</h1>
        <p className="text-sm text-slate-600 mt-2">{loadError || 'This listing is not available right now.'}</p>
        <div className="flex justify-center gap-3 mt-5">
          <button type="button" onClick={fetchJob} disabled={loading} className="btn-primary">{loading ? 'Retrying…' : 'Try again'}</button>
          <Link to="/jobs" className="btn-secondary">Back to jobs</Link>
        </div>
      </div>
    </div>
  );

  const salaryText = formatSalary(job);

  return (
    <div className="page-shell pb-28 lg:pb-8">
      {/* Breadcrumb & Meta Top Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/jobs" className="hover:text-primary-600 transition-colors flex items-center gap-1">
            <Briefcase className="w-4 h-4" /> Jobs
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <Link to="/jobs" className="hover:text-primary-600 transition-colors flex items-center gap-1">
            <Globe className="w-4 h-4" /> External Sources
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-gray-900 font-semibold truncate max-w-[200px] md:max-w-none">{job.title}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            External Opportunity
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
            Powered by Adzuna Engine
          </span>
        </div>
      </div>

      {/* Hero Card */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 md:p-8 relative overflow-hidden mb-6">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-gradient-to-br from-primary-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-700 font-bold text-2xl">
                  {job.company?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight break-anywhere">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1.5">
                <span className="font-semibold text-gray-900">{job.company}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {job.location}
                </span>
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Clock className="w-4 h-4" /> {formatDistanceToNow(new Date(job.created), { addSuffix: true })}
                </span>
                {salaryText && (
                  <span className="flex items-center gap-1 font-semibold text-gray-900">
                    <DollarSign className="w-4 h-4" /> {salaryText}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {job.jobType && (
                  <span className="badge bg-primary-100 text-primary-700 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {job.jobType}
                  </span>
                )}
                {job.category && (
                  <span className="badge bg-gray-100 text-gray-600">{job.category}</span>
                )}
                <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> External Job
                </span>
              </div>
            </div>
          </div>

          {/* CTA Cluster */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto flex-shrink-0">
            <button
              onClick={() => { navigator.clipboard.writeText(job.redirectUrl || window.location.href); toast.success('Link copied!'); }}
              className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            {user?.role === 'student' && (
              <button onClick={handleToggleSave} className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                {isSaved ? <BookmarkCheck className="w-4 h-4 text-primary-600" /> : <Bookmark className="w-4 h-4" />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
            <button onClick={handleViewOriginal} className="btn-primary px-6 py-2.5 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> View Original Job
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 bg-amber-50 rounded-lg p-3">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <Globe className="w-4 h-4 flex-shrink-0" />
            You will be redirected to the original job listing on Adzuna.
          </p>
        </div>
      </section>

      {/* TrustCheck */}
      <TrustCheck externalJobId={externalId} isExternal />

      {/* Dual Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT MAIN COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          {/* Description */}
          <section className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-anywhere">{job.description || 'No description available.'}</p>
          </section>

          {/* AI Job Match - only for students */}
          {user?.role === 'student' && (
            <ExternalJobMatchAnalysis externalJobId={externalId} />
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Job Overview */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Job Overview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Source</span>
                <span className="font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Adzuna
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Posted</span>
                <span className="font-medium">{format(new Date(job.created), 'MMM d, yyyy')}</span>
              </div>
              {job.jobType && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Job Type</span>
                  <span className="font-medium">{job.jobType}</span>
                </div>
              )}
              {job.category && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium">{job.category}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-right">{job.location}</span>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">About the Company</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-700 font-semibold">
                    {job.company?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{job.company}</p>
                <p className="text-xs text-gray-500">External listing</p>
              </div>
            </div>
            <a href={job.redirectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
              <Globe className="w-4 h-4" /> View on Adzuna
            </a>
          </div>

          {/* Attribution */}
          <div className="card bg-gray-50 border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              Jobs powered by <a href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:underline">Adzuna</a>
            </p>
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Bar (Mobile/Tablet) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg px-4 py-3 flex items-center justify-between gap-3 lg:hidden">
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-gray-900 truncate">{salaryText || job.title}</span>
          <span className="text-xs text-gray-500 truncate">{job.company} • Adzuna</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleViewOriginal} className="btn-primary px-4 py-2.5 flex items-center gap-1.5">
            <ExternalLink className="w-4 h-4" /> View Original
          </button>
          {user?.role === 'student' && (
            <button onClick={handleToggleSave} className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" aria-label="Save Job">
              {isSaved ? <BookmarkCheck className="w-5 h-5 text-primary-600" /> : <Bookmark className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
