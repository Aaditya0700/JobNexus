import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Building2, Loader2, Upload, Globe, MapPin, Users } from 'lucide-react';
import API from '../utils/api';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce',
  'Manufacturing', 'Consulting', 'Media', 'Real Estate', 'Other',
];

export default function CompanyPage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '',
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const { data } = await API.get('/companies/my');
      if (data.company) {
        setCompany(data.company);
        setForm({
          name: data.company.name || '',
          description: data.company.description || '',
          website: data.company.website || '',
          location: data.company.location || '',
          industry: data.company.industry || '',
          size: data.company.size || '',
        });
      }
    } catch {
      toast.error('Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (company) {
        const { data } = await API.put(`/companies/${company._id}`, form);
        setCompany(data.company);
        setIsEditing(false);
        toast.success('Company updated!');
      } else {
        const { data } = await API.post('/companies', form);
        setCompany(data.company);
        toast.success('Company registered!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !company) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await API.put(`/companies/${company._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCompany(data.company);
      toast.success('Logo updated!');
    } catch {
      toast.error('Failed to upload logo');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  // No company yet — show register form
  if (!company) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your Company</h1>
          <p className="text-gray-500 mt-2">Set up your company profile to start posting jobs</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Company Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-field resize-none" placeholder="What does your company do?" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yourcompany.com" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bangalore, India" className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Industry</label>
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="input-field">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Company Size</label>
                <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="input-field">
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : 'Register Company'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Company exists — show profile
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Profile</h1>

      {/* Company Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <Upload className="w-3 h-3 text-white" />
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
              {company.location && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{company.location}</span>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                  <Globe className="w-4 h-4" />Website
                </a>
              )}
              {company.size && (
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{company.size} employees</span>
              )}
            </div>
            {company.industry && (
              <span className="badge bg-gray-100 text-gray-600 mt-2">{company.industry}</span>
            )}
          </div>

          <button onClick={() => setIsEditing(!isEditing)} className="btn-secondary text-sm">
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {!isEditing && company.description && (
          <p className="text-gray-600 text-sm mt-4 pt-4 border-t border-gray-100">{company.description}</p>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Company Details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Company Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-field resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Industry</label>
                <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="input-field">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Company Size</label>
                <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="input-field">
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map((s) => <option key={s}>{s} employees</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}