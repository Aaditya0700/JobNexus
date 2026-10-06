import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Briefcase, Users, Eye, Trash2, PlusCircle, Loader2,
  Edit3, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  reviewing: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);
  const [applications, setApplications] = useState({});
  const [loadingApps, setLoadingApps] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await API.get('/jobs/my-jobs');
      setJobs(data.jobs);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (jobId) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobId);
    if (!applications[jobId]) {
      setLoadingApps(jobId);
      try {
        const { data } = await API.get(`/applications/job/${jobId}`);
        setApplications((prev) => ({ ...prev, [jobId]: data.applications }));
      } catch {
        toast.error('Failed to load applications');
      } finally {
        setLoadingApps(null);
      }
    }
  };

  const handleStatusUpdate = async (applicationId, jobId, status) => {
    try {
      await API.put(`/applications/${applicationId}/status`, { status });
      setApplications((prev) => ({
        ...prev,
        [jobId]: prev[jobId].map((a) => a._id === applicationId ? { ...a, status } : a),
      }));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job and all its applications?')) return;
    try {
      await API.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await API.put(`/jobs/${job._id}`, { status: newStatus });
      setJobs((prev) => prev.map((j) => j._id === job._id ? { ...j, status: newStatus } : j));
      toast.success(`Job ${newStatus}`);
    } catch {
      toast.error('Failed to update');
    }
  };

  const totalApplications = jobs.reduce((acc, j) => acc + (j.applications?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recruiter Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name?.split(' ')[0]} — manage your job postings and applications</p>
        </div>
        <Link to="/post-job" className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" /> Post Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Postings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{totalApplications}</p>
          <p className="text-sm text-gray-500 mt-1">Total Applications</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {jobs.filter((j) => j.status === 'active').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Live Jobs</p>
        </div>
      </div>

      {/* Jobs with Applications */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Job Postings</h2>
          <span className="text-xs text-gray-400">{jobs.length} total</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-primary-50 mx-auto flex items-center justify-center text-primary-600 mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <p className="text-gray-600 font-medium">No jobs posted yet</p>
            <Link to="/post-job" className="btn-primary mt-4 inline-block">Post Your First Job</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job._id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Job Row */}
                <div className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">{job.title}</h3>
                      <span className={`badge ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {job.applications?.length || 0} applicants</span>
                      <span>{job.jobType}</span>
                      <span>{format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggleStatus(job)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Toggle status">
                      {job.status === 'active' ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <Link to={`/post-job?edit=${job._id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDeleteJob(job._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleExpand(job._id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1">
                      {expandedJob === job._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Applications Drawer */}
                {expandedJob === job._id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    {loadingApps === job._id ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary-600" /></div>
                    ) : (applications[job._id] || []).length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No applications yet</p>
                    ) : (
                      <div className="space-y-2">
                        {(applications[job._id] || []).map((app) => (
                          <div key={app._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                {app.applicant?.profile?.profilePhoto ? (
                                  <img src={app.applicant.profile.profilePhoto} className="w-full h-full rounded-full object-cover" alt="" />
                                ) : (
                                  <span className="text-primary-700 text-xs font-bold">{app.applicant?.name?.[0]?.toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{app.applicant?.name}</p>
                                <p className="text-xs text-gray-500">{app.applicant?.email}</p>
                                {app.applicant?.profile?.skills?.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {app.applicant.profile.skills.slice(0, 3).map((s) => (
                                      <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{s}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {app.resumeUrl && (
                                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="View resume">
                                  <Eye className="w-4 h-4" />
                                </a>
                              )}
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusUpdate(app._id, job._id, e.target.value)}
                                className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${STATUS_COLORS[app.status]}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
