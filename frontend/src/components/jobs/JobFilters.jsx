import React from 'react';
import { X } from 'lucide-react';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];
const EXP_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager'];

export default function JobFilters({ filters, onChange, onReset }) {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  const toggleArray = (key, value) => {
    const arr = filters[key] || [];
    const updated = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    handleChange(key, updated);
  };

  const activeCount = Object.values(filters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  ).length;

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {activeCount > 0 && (
          <button onClick={onReset} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Job Type */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Job Type</label>
        <div className="space-y-2">
          {JOB_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.jobType || []).includes(type)}
                onChange={() => toggleArray('jobType', type)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Experience Level</label>
        <div className="space-y-2">
          {EXP_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(filters.experienceLevel || []).includes(level)}
                onChange={() => toggleArray('experienceLevel', level)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Salary Range */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Salary Range (₹)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.minSalary || ''}
            onChange={(e) => handleChange('minSalary', e.target.value)}
            placeholder="Min"
            className="input-field text-sm"
          />
          <input
            type="number"
            value={filters.maxSalary || ''}
            onChange={(e) => handleChange('maxSalary', e.target.value)}
            placeholder="Max"
            className="input-field text-sm"
          />
        </div>
      </div>
    </div>
  );
}