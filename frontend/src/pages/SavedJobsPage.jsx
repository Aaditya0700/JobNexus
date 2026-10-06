import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, BookmarkCheck, ExternalLink, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import API, { savedExternalJobsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/jobs/JobCard';

export default function SavedJobsPage() {
  const { user, updateUser } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedExternalJobs, setSavedExternalJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const [meRes, extRes] = await Promise.all([
        API.get('/auth/me'),
        user?.role === 'student' ? savedExternalJobsAPI.getAll() : Promise.resolve({ data: { jobs: [] } }),
      ]);
      setSavedJobs(meRes.data.user.savedJobs || []);
      setSavedExternalJobs(extRes.data.jobs || []);
    } catch {
      toast.error('Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      const { data } = await API.put(`/jobs/${jobId}/save`);
      updateUser({ savedJobs: data.savedJobs });
      setSavedJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success('Job removed from saved');
    } catch {
      toast.error('Failed to remove job');
    }
  };

  const handleUnsaveExternal = async (externalJobId) => {
    try {
      await savedExternalJobsAPI.unsave(externalJobId);
      setSavedExternalJobs((prev) => prev.filter((j) => j.externalJobId !== externalJobId));
      toast.success('Job removed from saved');
    } catch {
      toast.error('Failed to remove job');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <BookmarkCheck className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="text-gray-500 text-sm">{savedJobs.length + savedExternalJobs.length} job{savedJobs.length + savedExternalJobs.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : savedJobs.length === 0 && savedExternalJobs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🔖</div>
          <h3 className="text-lg font-semibold text-gray-900">No saved jobs yet</h3>
          <p className="text-gray-500 mt-2">Browse jobs and click the bookmark icon to save them here</p>
          <Link to="/jobs" className="btn-primary mt-4 inline-block">Browse Jobs</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {savedJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Jobs</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {savedJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onSave={handleUnsave}
                    isSaved={true}
                    showSave={true}
                  />
                ))}
              </div>
            </div>
          )}

          {savedExternalJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">External Jobs (Adzuna)</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {savedExternalJobs.map((job) => (
                  <div key={job._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {job.companyLogo ? (
                            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary-700 font-semibold">
                              {job.company?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/external-jobs/${job.externalJobId}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-1 block">
                            {job.title}
                          </Link>
                          <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnsaveExternal(job.externalJobId)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                        title="Remove from saved"
                      >
                        <BookmarkCheck className="w-5 h-5 text-primary-600" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="badge bg-primary-100 text-primary-700">External Job</span>
                      <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Adzuna
                      </span>
                      {job.jobType && <span className="badge bg-gray-100 text-gray-600">{job.jobType}</span>}
                    </div>

                    <div className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                      <Globe className="w-4 h-4" /> {job.location}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <Link to={`/external-jobs/${job.externalJobId}`} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                        View Details →
                      </Link>
                      <a
                        href={job.redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> View Original Job
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}