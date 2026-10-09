import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, SlidersHorizontal, X, Briefcase, Globe, Search, MapPin } from 'lucide-react';
import API, { externalJobsAPI, jobMatchAPI, savedExternalJobsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/jobs/JobCard';
import ExternalJobCard from '../components/jobs/ExternalJobCard';
import JobFilters from '../components/jobs/JobFilters';
import { isJobSaved } from '../utils/jobState';
import { getPaginationItems } from '../utils/pagination';

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [externalJobs, setExternalJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [externalLoading, setExternalLoading] = useState(false);
  const [internalError, setInternalError] = useState('');
  const [externalError, setExternalError] = useState('');
  const internalRequestId = useRef(0);
  const externalRequestId = useRef(0);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, current: 1 });
  const [externalPagination, setExternalPagination] = useState({ total: 0, pages: 1, current: 1 });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // External job match state
  const [externalAnalyses, setExternalAnalyses] = useState({});
  const [analyzingExternalId, setAnalyzingExternalId] = useState(null);
  const [savedExternalIds, setSavedExternalIds] = useState(new Set());

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    location: searchParams.get('location') || '',
    jobType: [],
    experienceLevel: [],
    minSalary: '',
    maxSalary: '',
  });

  const fetchInternalJobs = useCallback(async (page = 1) => {
    const requestId = ++internalRequestId.current;
    setLoading(true);
    setInternalError('');
    try {
      const params = { page, limit: 12 };
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.location) params.location = filters.location;
      if (filters.jobType.length) params.jobType = filters.jobType.join(',');
      if (filters.experienceLevel.length) params.experienceLevel = filters.experienceLevel.join(',');
      if (filters.minSalary) params.minSalary = filters.minSalary;
      if (filters.maxSalary) params.maxSalary = filters.maxSalary;

      const { data } = await API.get('/jobs', { params });
      if (requestId !== internalRequestId.current) return;
      setJobs(data.jobs);
      setPagination({ total: data.total, pages: data.pages, current: data.currentPage });
    } catch {
      if (requestId !== internalRequestId.current) return;
      setInternalError('Internal jobs could not be loaded. Check your connection and retry.');
    } finally {
      if (requestId === internalRequestId.current) setLoading(false);
    }
  }, [filters]);

  const fetchExternalJobs = useCallback(async (page = 1) => {
    const requestId = ++externalRequestId.current;
    setExternalLoading(true);
    setExternalError('');
    try {
      const params = {
        page,
        results_per_page: 12,
        q: filters.keyword || undefined,
        location: filters.location || undefined,
        sort_by: 'relevance',
      };

      const { data } = await externalJobsAPI.getJobs(params);
      if (requestId !== externalRequestId.current) return;
      setExternalJobs(data.jobs);
      setExternalError(data.stale ? 'Adzuna is temporarily unavailable.' : '');
      setExternalPagination({
        total: data.total,
        pages: data.totalPages || Math.ceil(data.total / 12) || 1,
        current: data.page,
      });
    } catch (error) {
      if (requestId !== externalRequestId.current) return;
      setExternalError(error.response?.data?.message || 'External jobs could not be loaded. Check your connection and retry.');
    } finally {
      if (requestId === externalRequestId.current) setExternalLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInternalJobs(1);
    fetchExternalJobs(1);
  }, [fetchInternalJobs, fetchExternalJobs]);

  // Load the current student's saved external jobs once for saved-state display
  useEffect(() => {
    if (user?.role !== 'student') {
      setSavedExternalIds(new Set());
      return;
    }
    let mounted = true;
    savedExternalJobsAPI.getAll()
      .then(({ data }) => {
        if (mounted && data?.jobs) {
          setSavedExternalIds(new Set(data.jobs.map((j) => j.externalJobId)));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user]);

  const handleSaveJob = async (jobId) => {
    if (!user) return toast.error('Please log in to save jobs');
    if (user.role !== 'student') return;
    try {
      const { data } = await API.put(`/jobs/${jobId}/save`);
      updateUser({ savedJobs: data.savedJobs });
      toast.success(data.saved ? 'Job saved!' : 'Job removed from saved');
    } catch {
      toast.error('Failed to save job');
    }
  };

  const handleSaveExternalJob = async (job) => {
    if (!user) return toast.error('Please log in to save jobs');
    if (user.role !== 'student') return;
    const isSaved = savedExternalIds.has(job.externalId);
    try {
      if (isSaved) {
        await savedExternalJobsAPI.unsave(job.externalId);
        setSavedExternalIds((prev) => {
          const next = new Set(prev);
          next.delete(job.externalId);
          return next;
        });
        toast.success('Job removed from saved');
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
        setSavedExternalIds((prev) => new Set(prev).add(job.externalId));
        toast.success('Job saved!');
      }
    } catch {
      toast.error('Failed to save job');
    }
  };

  const handleAnalyzeExternalJob = async (externalJobId) => {
    if (!user) return toast.error('Please log in to use AI Match');
    if (user.role !== 'student') return toast.error('Only students can use AI Job Match');
    if (analyzingExternalId) return;

    setAnalyzingExternalId(externalJobId);
    try {
      const { data } = await jobMatchAPI.analyzeExternalJob(externalJobId);
      if (data?.analysis) {
        setExternalAnalyses(prev => ({ ...prev, [externalJobId]: data.analysis }));
        toast.success('AI Match analyzed successfully');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to analyze match';
      toast.error(message);
    } finally {
      setAnalyzingExternalId(null);
    }
  };

  const resetFilters = () => {
    setFilters({ keyword: '', location: '', jobType: [], experienceLevel: [], minSalary: '', maxSalary: '' });
    setSearchParams({});
    fetchInternalJobs(1);
    fetchExternalJobs(1);
  };

  const currentJobs = activeTab === 'internal' ? jobs : activeTab === 'external' ? externalJobs : [...jobs, ...externalJobs];
  const currentPagination = activeTab === 'internal' ? pagination : activeTab === 'external' ? externalPagination : pagination;
  const currentLoading = activeTab === 'external' ? externalLoading : loading;

  const handlePageChange = (page) => {
    if (activeTab === 'external') {
      fetchExternalJobs(page);
    } else {
      fetchInternalJobs(page);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Jobs', count: jobs.length + externalJobs.length },
    { id: 'internal', label: 'Jobs on My Portal', count: jobs.length },
    { id: 'external', label: 'External Jobs', count: externalJobs.length },
  ];

  const totalListings = pagination.total + externalPagination.total;

  // Skills derived from the real jobs currently loaded
  const skillsInDemand = useMemo(() => {
    const counts = {};
    currentJobs.forEach((job) => {
      (job.skills || []).forEach((skill) => {
        counts[skill] = (counts[skill] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [currentJobs]);

  const removeFilter = (key, value) => {
    if (Array.isArray(filters[key])) {
      setFilters({ ...filters, [key]: filters[key].filter((v) => v !== value) });
    } else {
      setFilters({ ...filters, [key]: '' });
    }
  };

  const activeChips = [];
  if (filters.keyword) activeChips.push({ label: `Keyword: ${filters.keyword}`, onClear: () => removeFilter('keyword') });
  if (filters.location) activeChips.push({ label: `Location: ${filters.location}`, onClear: () => removeFilter('location') });
  filters.jobType.forEach((t) => activeChips.push({ label: t, onClear: () => removeFilter('jobType', t) }));
  filters.experienceLevel.forEach((l) => activeChips.push({ label: l, onClear: () => removeFilter('experienceLevel', l) }));
  if (filters.minSalary) activeChips.push({ label: `Min ₹${filters.minSalary}`, onClear: () => removeFilter('minSalary') });
  if (filters.maxSalary) activeChips.push({ label: `Max ₹${filters.maxSalary}`, onClear: () => removeFilter('maxSalary') });

  const pageStart = currentPagination.total === 0 ? 0 : (currentPagination.current - 1) * 12 + 1;
  const pageEnd = Math.min(pageStart + currentJobs.length - 1, currentPagination.total);

  return (
    <div className="page-shell">
      {/* Discovery Header */}
      <section className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-50 text-xs font-medium text-primary-700">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse"></span>
                Live Market Sync & Gemini Engine
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">{totalListings.toLocaleString()} listings indexed</span>
            </div>
            <h1 className="page-heading">Explore Opportunities</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-2xl">
              Search verified listings across partner companies and external global job indexes powered by Adzuna.
            </p>
          </div>
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden btn-secondary flex items-center gap-2 text-sm self-start"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Search Command Bar */}
        <div className="bg-white rounded-xl p-2 shadow-card border border-slate-200/80">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col lg:flex-row items-stretch gap-2"
          >
            <div className="flex-1 flex items-center px-3 py-2.5 bg-gray-50 rounded-lg gap-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="Job title, skills, or company"
                className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
            <div className="flex-1 lg:max-w-xs flex items-center px-3 py-2.5 bg-gray-50 rounded-lg gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="City, state, or Remote"
                className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
            </div>
            <button type="submit" className="btn-primary px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
              Find Jobs
            </button>
          </form>
        </div>

        {/* Active Filter Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Filter by:</span>
          {activeChips.length === 0 && (
            <span className="text-xs text-gray-400">No filters applied</span>
          )}
          {activeChips.map((chip, i) => (
            <button
              key={i}
              onClick={chip.onClear}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 transition-colors"
            >
              {chip.label}
              <X className="w-3 h-3" />
            </button>
          ))}
          {activeChips.length > 0 && (
            <button onClick={resetFilters} className="text-xs text-primary-600 hover:underline ml-1">
              Reset all
            </button>
          )}
        </div>
      </section>

      {/* Source Segment Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.id === 'external' ? <Globe className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Discovery Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PRIMARY FEED */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-w-0">
          {[
            ...(activeTab !== 'external' && internalError ? [{ source: 'internal', message: internalError }] : []),
            ...(activeTab !== 'internal' && externalError ? [{ source: 'external', message: externalError }] : []),
          ].map(({ source, message }) => (
            <div key={source} role="alert" className="card border-amber-200 bg-amber-50 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
              <span>{message}{source === 'external' && externalJobs.length ? ' Showing previously loaded results.' : ''}{source === 'internal' && jobs.length ? ' Showing previously loaded results.' : ''}</span>
              <button
                type="button"
                onClick={() => source === 'internal' ? fetchInternalJobs(1) : fetchExternalJobs(1)}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                Retry
              </button>
            </div>
          ))}
          {currentLoading ? (
            <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading jobs">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card space-y-3">
                  <div className="flex gap-3">
                    <div className="skeleton w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-5 w-2/3" />
                      <div className="skeleton h-4 w-1/3" />
                    </div>
                  </div>
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-4/5" />
                </div>
              ))}
            </div>
          ) : currentJobs.length === 0 && !(
            (activeTab !== 'external' && internalError) ||
            (activeTab !== 'internal' && externalError)
          ) ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-50 mx-auto flex items-center justify-center text-primary-600 mb-4">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {activeTab === 'external' ? 'No external jobs found' : 'No jobs found'}
              </h3>
              <p className="text-gray-500 text-sm mt-1 mb-6 max-w-md mx-auto">
                {activeTab === 'external'
                  ? 'Try adjusting your search or check back later for new listings from Adzuna.'
                  : 'Try adjusting your search filters or widening your location.'}
              </p>
              <button onClick={resetFilters} className="btn-primary">
                Reset Search Parameters
              </button>
            </div>
          ) : (
            <>
              {currentJobs.map((job) => (
                job.source === 'adzuna' ? (
                  <ExternalJobCard
                    key={job.externalId}
                    job={job}
                    onAnalyze={user?.role === 'student' ? handleAnalyzeExternalJob : null}
                    analysis={externalAnalyses[job.externalId]}
                    isAnalyzing={analyzingExternalId === job.externalId}
                    onSave={user?.role === 'student' ? () => handleSaveExternalJob(job) : null}
                    isSaved={savedExternalIds.has(job.externalId)}
                    showSave={user?.role === 'student'}
                  />
                ) : (
                  <JobCard
                    key={job._id}
                    job={job}
                    onSave={user?.role === 'student' ? handleSaveJob : null}
                    isSaved={isJobSaved(user?.savedJobs, job._id)}
                    showSave={user?.role === 'student'}
                  />
                )
              ))}

              {/* Pagination */}
              {currentPagination.pages > 1 && (
                <nav aria-label="Pagination" className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-gray-500 px-1">
                    Showing <strong className="text-gray-900 font-semibold">{pageStart} - {pageEnd}</strong> of <strong className="text-gray-900 font-semibold">{currentPagination.total}</strong> total listings
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    <button
                      onClick={() => handlePageChange(currentPagination.current - 1)}
                      disabled={currentPagination.current === 1}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {getPaginationItems(currentPagination.pages, currentPagination.current).map((item) => (
                      typeof item === 'number' ? (
                        <button
                          key={item}
                          onClick={() => handlePageChange(item)}
                          aria-current={item === currentPagination.current ? 'page' : undefined}
                          aria-label={`Page ${item}`}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            item === currentPagination.current
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      ) : (
                        <span key={item} aria-hidden="true" className="px-1 text-gray-400">…</span>
                      )
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPagination.current + 1)}
                      disabled={currentPagination.current === currentPagination.pages}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </nav>
              )}

              {activeTab === 'external' && !externalLoading && (
                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5 pt-2">
                  <Globe className="w-3.5 h-3.5" />
                  Jobs powered by Adzuna
                </p>
              )}
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:flex lg:col-span-4 flex-col gap-4">
          {/* Filters */}
          <JobFilters filters={filters} onChange={setFilters} onReset={resetFilters} />

          {/* Skills In Demand (derived from loaded jobs) */}
          {skillsInDemand.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">Skills In Demand</h3>
                <span className="text-xs text-gray-400">In loaded listings</span>
              </div>
              <div className="space-y-2">
                {skillsInDemand.map(([skill, count]) => (
                  <div key={skill} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-700">{skill}</span>
                    <span className="text-xs text-gray-400">{count} {count === 1 ? 'job' : 'jobs'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adzuna Disclosure */}
          <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl border border-primary-100 p-4">
            <div className="flex items-start gap-2">
              <Globe className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Adzuna Global Pipeline</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  External opportunities are synced from Adzuna and external applies redirect directly to the official source.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Filters Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white overflow-y-auto p-4 shadow-dropdown">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <JobFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
          </div>
        </div>
      )}
    </div>
  );
}
