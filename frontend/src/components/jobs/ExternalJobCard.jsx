import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Building2, MapPin, Briefcase, DollarSign, Clock, Sparkles, Brain, Bookmark, BookmarkCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const JOB_TYPE_COLORS = {
  'Full-time': 'bg-green-100 text-green-700',
  'Part-time': 'bg-blue-100 text-blue-700',
  'Contract': 'bg-orange-100 text-orange-700',
  'Internship': 'bg-purple-100 text-purple-700',
  'Remote': 'bg-cyan-100 text-cyan-700',
  'Hybrid': 'bg-indigo-100 text-indigo-700',
  'Permanent': 'bg-green-100 text-green-700',
  'Temporary': 'bg-orange-100 text-orange-700',
};

export default function ExternalJobCard({ job, onAnalyze, analysis, isAnalyzing, onSave, isSaved, showSave = false }) {
  const formatSalary = (job) => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
    if (job.salaryMin) return `From ${fmt(job.salaryMin)}`;
    return `Up to ${fmt(job.salaryMax)}`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasAnalysis = analysis && typeof analysis.matchPercentage === 'number';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group p-5 relative">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : null}
            {!job.companyLogo && (
              <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-700 font-semibold text-lg">
                {getInitials(job.company)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link to={`/external-jobs/${job.externalId}`} className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1 block">
              {job.title}
            </Link>
            <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="badge bg-primary-100 text-primary-700 text-xs">External Job</span>
        {job.jobType && (
          <span className={`badge ${JOB_TYPE_COLORS[job.jobType] || 'bg-gray-100 text-gray-600'}`}>
            <Briefcase className="w-3 h-3 mr-1" /> {job.jobType}
          </span>
        )}
        {job.category && (
          <span className="badge bg-gray-100 text-gray-600">
            {job.category}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>
        {formatSalary(job) && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>{formatSalary(job)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <Clock className="w-4 h-4" />
          <span>{formatDistanceToNow(new Date(job.created), { addSuffix: true })}</span>
        </div>
      </div>

      {job.description && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-3">
          {job.description}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Source: Adzuna
        </span>
        <div className="flex items-center gap-2">
          {showSave && onSave && (
            <button
              onClick={onSave}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-primary-600" />
              ) : (
                <Bookmark className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
          {onAnalyze && (
            <>
              {hasAnalysis ? (
                <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Match: {analysis.matchPercentage}%
                </span>
              ) : (
                <button
                  onClick={() => onAnalyze(job.externalId)}
                  disabled={isAnalyzing}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-3 h-3" /> AI Match
                    </>
                  )}
                </button>
              )}
            </>
          )}
          <Link to={`/external-jobs/${job.externalId}`} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> View Job
          </Link>
        </div>
      </div>
    </div>
  );
}