import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, X, ArrowLeft } from 'lucide-react';
import API from '../utils/api';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];
const EXP_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager'];

const INITIAL_FORM = {
  title: '',
  description: '',
  location: '',
  jobType: 'Full-time',
  experienceLevel: 'Entry Level',
  salary: { min: '', max: '', currency: 'INR', period: 'yearly' },
  openings: 1,
  deadline: '',
  skills: [],
  requirements: [],
  status: 'active',
};

export default function PostJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [reqInput, setReqInput] = useState('');
  const [hasCompany, setHasCompany] = useState(true);

  useEffect(() => {
    checkCompany();
    if (editId) fetchJob();
  }, [editId]);

  const checkCompany = async () => {
    try {
      const { data } = await API.get('/companies/my');
      if (!data.company) setHasCompany(false);
    } catch {
      setHasCompany(false);
    }
  };

  const fetchJob = async () => {
    try {
      const { data } = await API.get(`/jobs/${editId}`);
      const j = data.job;
      setForm({
        title: j.title || '',
        description: j.description || '',
        location: j.location || '',
        jobType: j.jobType || 'Full-time',
        experienceLevel: j.experienceLevel || 'Entry Level',
        salary: j.salary || { min: '', max: '', currency: 'INR', period: 'yearly' },
        openings: j.openings || 1,
        deadline: j.deadline ? j.deadline.split('T')[0] : '',
        skills: j.skills || [],
        requirements: j.requirements || [],
        status: j.status || 'active',
      });
    } catch {
      toast.error('Failed to load job');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasCompany) return toast.error('Please register your company first');

    setLoading(true);
    try {
      const payload = {
        ...form,
        salary: {
          ...form.salary,
          min: form.salary.min ? Number(form.salary.min) : undefined,
          max: form.salary.max ? Number(form.salary.max) : undefined,
        },
      };

      if (editId) {
        await API.put(`/jobs/${editId}`, payload);
        toast.success('Job updated successfully!');
      } else {
        await API.post('/jobs', payload);
        toast.success('Job posted successfully!');
      }
      navigate('/recruiter');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) return;
    setForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
    setSkillInput('');
  };

  const removeSkill = (s) => setForm((prev) => ({ ...prev, skills: prev.skills.filter((x) => x !== s) }));

  const addRequirement = () => {
    const r = reqInput.trim();
    if (!r) return;
    setForm((prev) => ({ ...prev, requirements: [...prev.requirements, r] }));
    setReqInput('');
  };

  const removeRequirement = (i) => setForm((prev) => ({ ...prev, requirements: prev.requirements.filter((_, idx) => idx !== i) }));

  if (!hasCompany) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
          <Plus className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Set Up Your Company First</h2>
        <p className="text-gray-500 mb-6">You need to register your company before posting jobs.</p>
        <button onClick={() => navigate('/company')} className="btn-primary">Register Company</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {editId ? 'Edit Job' : 'Post a New Job'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Job Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior React Developer"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Job Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the role, responsibilities and what you're looking for..."
              rows={5}
              className="input-field resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Location *</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Bangalore, Remote"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Openings</label>
              <input
                type="number"
                value={form.openings}
                onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })}
                min={1}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Job Type *</label>
              <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className="input-field">
                {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Experience Level</label>
              <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className="input-field">
                {EXP_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Application Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="input-field"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Salary */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Salary (Optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Min Salary (₹)</label>
              <input
                type="number"
                value={form.salary.min}
                onChange={(e) => setForm({ ...form, salary: { ...form.salary, min: e.target.value } })}
                placeholder="e.g. 500000"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Max Salary (₹)</label>
              <input
                type="number"
                value={form.salary.max}
                onChange={(e) => setForm({ ...form, salary: { ...form.salary, max: e.target.value } })}
                placeholder="e.g. 1000000"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Required Skills</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="e.g. React, Node.js..."
              className="input-field flex-1"
            />
            <button type="button" onClick={addSkill} className="btn-secondary flex items-center gap-1 px-3">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <span key={s} className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm rounded-lg font-medium">
                {s}
                <button type="button" onClick={() => removeSkill(s)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Requirements (Optional)</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={reqInput}
              onChange={(e) => setReqInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              placeholder="e.g. 3+ years of experience..."
              className="input-field flex-1"
            />
            <button type="button" onClick={addRequirement} className="btn-secondary flex items-center gap-1 px-3">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <ul className="space-y-2">
            {form.requirements.map((r, i) => (
              <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                {r}
                <button type="button" onClick={() => removeRequirement(i)} className="text-gray-400 hover:text-red-500 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary px-8 py-2.5 flex items-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editId ? 'Update Job' : 'Post Job'}
          </button>
          <button type="button" onClick={() => navigate('/recruiter')} className="btn-secondary px-6 py-2.5">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}