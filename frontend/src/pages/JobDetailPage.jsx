import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MapPin, Clock, Briefcase, DollarSign, Users, Building2,
  Globe, Bookmark, BookmarkCheck, Share2, ArrowLeft, Loader2, CheckCircle,
  ChevronRight, Send,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import JobMatchAnalysis from '../components/job/JobMatchAnalysis';
import TrustCheck from '../components/job/TrustCheck';
import { isJobSaved } from '../utils/jobState';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (user && job) {
      checkIfApplied();
    }
  }, [user, job]);

  const fetchJob = async () => {
    try {
      const { data } = await API.get(`/jobs/${id}`);
      setJob(data.job);
    } catch {
      toast.error('Job not found');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const { data } = await API.get('/applications/my');
      const hasApplied = data.applications.some((a) => a.job?._id === id);
      setApplied(hasApplied);
    } catch {}
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!user.profile?.resumeUrl) return toast.error('Please upload a resume first in your profile');

    setApplying(true);
    try {
      await API.post(`/applications/${id}`, { coverLetter });
      setApplied(true);
      setShowApplyForm(false);
      toast.success('Application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await API.put(`/jobs/${id}/save`);
      updateUser({ savedJobs: data.savedJobs });
      toast.success(data.saved ? 'Job saved!' : 'Removed from saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const openApplyForm = () => {
    setShowApplyForm(true);
    setTimeout(() => {
      document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );
  if (!job) return null;

  const isSaved = isJobSaved(user?.savedJobs, id);
  const salaryText = job.salary?.min
    ? `₹${(job.salary.min / 100000).toFixed(1)}L${job.salary.max ? ` - ₹${(job.salary.max / 100000).toFixed(1)}L` : '+'}`
    : null;

  return (
    <div className="page-shell pb-28 lg:pb-8">
      {/* Breadcrumbs & Meta Top Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/jobs" className="hover:text-primary-600 transition-colors flex items-center gap-1">
            <Briefcase className="w-4 h-4" /> Jobs
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <Link to="/jobs" className="hover:text-primary-600 transition-colors flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" /> Internal Portal
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-gray-900 font-semibold truncate max-w-[200px] md:max-w-none">{job.title}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          {job.status === 'active' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
              Portal Verified Job
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
            Direct Apply Available
          </span>
        </div>
      </div>

      {/* Hero Card */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6 md:p-8 relative overflow-hidden mb-6">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-gradient-to-br from-primary-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 max-w-3xl min-w-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-primary-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {job.company?.logo ? (
                <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-primary-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 mb-1">{job.company?.name}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight break-anywhere">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" /> {job.jobType}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {job.experienceLevel}
                </span>
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Clock className="w-4 h-4" /> {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </span>
              </div>
              {salaryText && (
                <p className="text-lg font-bold text-gray-900 mt-3">{salaryText} <span className="text-sm font-normal text-gray-500">/ year</span></p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {job.status === 'active' && <span className="badge bg-green-100 text-green-700">Actively Hiring</span>}
                <span className="badge bg-gray-100 text-gray-600">{job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Right CTA Cluster */}
          <div className="flex flex-col items-stretch gap-2 w-full lg:w-auto flex-shrink-0">
            {user?.role === 'student' && (
              applied ? (
                <div className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
                  <CheckCircle className="w-4 h-4" /> Applied
                </div>
              ) : (
                <button onClick={openApplyForm} className="btn-primary px-6 py-2.5 flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Apply Now
                </button>
              )
            )}
            {!user && (
              <button onClick={() => navigate('/login')} className="btn-primary px-6 py-2.5">
                Login to Apply
              </button>
            )}
            <div className="flex items-center gap-2">
              {user?.role === 'student' && (
                <button onClick={handleSave} className="btn-secondary px-4 py-2.5 flex items-center gap-2 flex-1 justify-center">
                  {isSaved ? <BookmarkCheck className="w-4 h-4 text-primary-600" /> : <Bookmark className="w-4 h-4" />}
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              )}
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                className="btn-secondary px-4 py-2.5"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 flex items-center justify-center lg:justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Direct JobNexus candidate routing
            </p>
          </div>
        </div>

        {/* Apply Form */}
        {showApplyForm && !applied && (
          <form id="apply-form" onSubmit={handleApply} className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Write a Cover Letter (Optional)</h3>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the recruiter why you're a great fit for this role..."
              rows={4}
              className="input-field resize-none"
            />
            <div className="flex gap-3 mt-3">
              <button type="submit" disabled={applying} className="btn-primary flex items-center gap-2">
                {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application'}
              </button>
              <button type="button" onClick={() => setShowApplyForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </section>

      {/* TrustCheck */}
      <TrustCheck jobId={id} />

      {/* Dual Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT MAIN COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          {/* Description */}
          <section className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-anywhere">{job.description}</p>
          </section>

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <section className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2.5">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills */}
          {job.skills?.length > 0 && (
            <section className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* AI Job Match - only for students */}
          {user?.role === 'student' && (
            <JobMatchAnalysis jobId={id} />
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Job Overview */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Job Overview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Posted</span>
                <span className="font-medium">{format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {job.deadline && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Deadline</span>
                  <span className="font-medium">{format(new Date(job.deadline), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Applicants</span>
                <span className="font-medium">{job.applications?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Openings</span>
                <span className="font-medium">{job.openings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Job Type</span>
                <span className="font-medium">{job.jobType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Experience</span>
                <span className="font-medium">{job.experienceLevel}</span>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">About the Company</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                {job.company?.logo ? (
                  <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{job.company?.name}</p>
                {job.company?.industry && <p className="text-xs text-gray-500">{job.company.industry}</p>}
              </div>
            </div>
            {job.company?.description && (
              <p className="text-sm text-gray-500 line-clamp-3">{job.company.description}</p>
            )}
            {job.company?.website && (
              <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary-600 mt-3 hover:underline">
                <Globe className="w-4 h-4" /> Visit Website
              </a>
            )}
            {job.company?.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                <MapPin className="w-4 h-4" /> {job.company.location}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Quick-Apply Bar (Mobile/Tablet) */}
      {user?.role === 'student' && !applied && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-4 py-3 flex items-center justify-between gap-3 lg:hidden safe-area">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 truncate">{salaryText || job.title}</span>
            <span className="text-xs text-gray-500 truncate">{job.company?.name} • Direct Apply</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button aria-label="Save Job" onClick={handleSave} className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              {isSaved ? <BookmarkCheck className="w-5 h-5 text-primary-600" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button onClick={openApplyForm} className="btn-primary px-4 py-2.5 flex items-center gap-1.5">
              <Send className="w-4 h-4" /> Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
