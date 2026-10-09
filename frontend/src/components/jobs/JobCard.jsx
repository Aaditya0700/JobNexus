import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Bookmark, BookmarkCheck, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const JOB_TYPE_COLORS = {
  'Full-time': 'bg-green-100 text-green-700',
  'Part-time': 'bg-blue-100 text-blue-700',
  'Contract': 'bg-orange-100 text-orange-700',
  'Internship': 'bg-purple-100 text-purple-700',
  'Remote': 'bg-cyan-100 text-cyan-700',
  'Hybrid': 'bg-indigo-100 text-indigo-700',
};

export default function JobCard({ job, onSave, isSaved, showSave = true }) {
  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return null;
    const fmt = (n) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`;
    if (salary.min && salary.max) return `₹${fmt(salary.min)} - ₹${fmt(salary.max)}`;
    if (salary.min) return `From ₹${fmt(salary.min)}`;
    return `Up to ₹${fmt(salary.max)}`;
  };

  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Company Logo */}
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.company?.logo ? (
              <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link to={`/jobs/${job._id}`} className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 break-anywhere block">
              {job.title}
            </Link>
            <p className="text-sm text-slate-500 mt-0.5 truncate">{job.company?.name || 'Unknown Company'}</p>
          </div>
        </div>

        {showSave && onSave && (
          <button
            onClick={() => onSave(job._id)}
            className="icon-button p-2 rounded-lg hover:bg-slate-100 flex-shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title={isSaved ? 'Remove from saved' : 'Save job'}
            aria-label={isSaved ? 'Remove from saved' : 'Save job'}
          >
            {isSaved ? (
              <BookmarkCheck className="w-5 h-5 text-primary-600" />
            ) : (
              <Bookmark className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-4">
        <span className={`badge ${JOB_TYPE_COLORS[job.jobType] || 'bg-gray-100 text-gray-600'}`}>
          {job.jobType}
        </span>
        <span className="badge bg-gray-100 text-gray-600">{job.experienceLevel}</span>
      </div>

      {/* Info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-slate-500">
        <div className="flex items-center gap-1 min-w-0">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        {formatSalary(job.salary) && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span>{formatSalary(job.salary)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 sm:ml-auto">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Skills */}
      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full font-medium">
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Applications count */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400">{job.applications?.length || 0} applicants</span>
        <Link to={`/jobs/${job._id}`} className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
          View Details →
        </Link>
      </div>
    </div>
  );
}
