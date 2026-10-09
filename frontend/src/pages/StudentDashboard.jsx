import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Briefcase, Clock, CheckCircle2, XCircle,
  Eye, Trash2, Loader2, TrendingUp, BookmarkCheck, Sparkles,
  FileText, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', Icon: Clock },
  reviewing: { label: 'Under Review', color: 'bg-blue-100 text-blue-700', Icon: Eye },
  shortlisted: { label: 'Shortlisted', color: 'bg-purple-100 text-purple-700', Icon: TrendingUp },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
  rejected: { label: 'Not Selected', color: 'bg-red-100 text-red-700', Icon: XCircle },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await API.get('/applications/my');
      setApplications(data.applications);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this application?')) return;
    setWithdrawing(id);
    try {
      await API.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a._id !== id));
      toast.success('Application withdrawn');
    } catch {
      toast.error('Failed to withdraw');
    } finally {
      setWithdrawing(null);
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    reviewing: applications.filter((a) => a.status === 'reviewing').length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    hired: applications.filter((a) => a.status === 'hired').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };

  const pipelineRows = [
    { label: 'Pending Review', count: stats.pending, bar: 'bg-yellow-400' },
    { label: 'Under Review', count: stats.reviewing, bar: 'bg-blue-400' },
    { label: 'Shortlisted', count: stats.shortlisted, bar: 'bg-purple-400' },
    { label: 'Hired', count: stats.hired, bar: 'bg-green-500' },
    { label: 'Not Selected', count: stats.rejected, bar: 'bg-red-400' },
  ];

  return (
    <div className="page-shell">
      {/* Welcome */}
      <div className="mb-8 motion-enter">
        <h1 className="page-heading">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="page-subheading">Track your job applications and career progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 motion-stagger">
        {[
          { label: 'Total Applied', value: stats.total, color: 'text-gray-900' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-purple-600' },
          { label: 'Hired', value: stats.hired, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200/80 shadow-card p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 motion-stagger">
        <Link to="/jobs" className="card-hover flex items-center gap-3 p-4 min-w-0">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Browse Jobs</p>
            <p className="text-xs text-gray-500">Find new opportunities</p>
          </div>
        </Link>
        <Link to="/saved-jobs" className="card-hover flex items-center gap-3 p-4 min-w-0">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookmarkCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Saved Jobs</p>
            <p className="text-xs text-gray-500">{user?.savedJobs?.length || 0} saved</p>
          </div>
        </Link>
        <Link to="/profile" className="card-hover flex items-center gap-3 p-4 min-w-0">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Update Profile</p>
            <p className="text-xs text-gray-500">
              {user?.profile?.resumeUrl ? 'Resume uploaded ✓' : 'Upload resume'}
            </p>
          </div>
        </Link>
        <Link to="/resume-analyzer" className="card-hover flex items-center gap-3 p-4 min-w-0">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Resume Analyzer</p>
            <p className="text-xs text-gray-500">
              {user?.profile?.resumeAnalyzedAt
                ? `Last run ${format(new Date(user.profile.resumeAnalyzedAt), 'MMM d')}`
                : 'Get an AI score'}
            </p>
          </div>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start motion-stagger">
        {/* Applications */}
        <div className="lg:col-span-8 min-w-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Applications</h2>
              <span className="text-xs text-gray-400">{stats.total} total</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-primary-50 mx-auto flex items-center justify-center text-primary-600 mb-3">
                  <Briefcase className="w-6 h-6" />
                </div>
                <p className="text-gray-600 font-medium">No applications yet</p>
                <p className="text-gray-400 text-sm mt-1">Start applying to jobs to track them here</p>
                <Link to="/jobs" className="btn-primary mt-4 inline-block">Browse Jobs</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => {
                  const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  const StatusIcon = config.Icon;
                  return (
                    <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors min-w-0">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {app.job?.company?.logo ? (
                            <img src={app.job.company.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Briefcase className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/jobs/${app.job?._id}`} className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 break-anywhere block">
                            {app.job?.title || 'Job Deleted'}
                          </Link>
                          <p className="text-sm text-gray-500">{app.job?.company?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`badge ${config.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                        {app.status === 'pending' && (
                          <button
                            onClick={() => handleWithdraw(app._id)}
                            disabled={withdrawing === app._id}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Withdraw"
                          >
                            {withdrawing === app._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* Application Pipeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Application Pipeline</h3>
              <span className="text-xs text-gray-400">Live data</span>
            </div>
            <div className="space-y-3">
              {pipelineRows.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-semibold text-gray-900">{row.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.bar} rounded-full transition-all`}
                      style={{ width: `${stats.total ? Math.max((row.count / stats.total) * 100, row.count > 0 ? 6 : 0) : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resume / Analyzer Status */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Resume Status</h3>
            {user?.profile?.resumeUrl ? (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" /> Resume uploaded
                </p>
                {user.profile.resumeAnalyzedAt && (
                  <p className="text-gray-500">
                    Last analyzed {format(new Date(user.profile.resumeAnalyzedAt), 'MMM d, yyyy')}
                  </p>
                )}
                <Link to="/resume-analyzer" className="inline-flex items-center gap-1 text-primary-600 font-medium text-sm mt-2 hover:underline">
                  Open Resume Analyzer <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                <p>No resume uploaded yet. Upload your resume to unlock AI matching.</p>
                <Link to="/profile" className="inline-flex items-center gap-1 text-primary-600 font-medium text-sm mt-2 hover:underline">
                  Go to Profile <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Saved Jobs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Saved Jobs</h3>
            <p className="text-sm text-gray-500 mb-3">{user?.savedJobs?.length || 0} job{user?.savedJobs?.length === 1 ? '' : 's'} saved for later.</p>
            <Link to="/saved-jobs" className="inline-flex items-center gap-1 text-primary-600 font-medium text-sm hover:underline">
              View saved jobs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
