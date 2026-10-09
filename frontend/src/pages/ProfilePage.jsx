import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { User, Upload, Loader2, Camera, FileText, Lock, Plus, X } from 'lucide-react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.profile?.bio || '',
    skills: user?.profile?.skills || [],
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('bio', profileForm.bio);
      profileForm.skills.forEach((s) => formData.append('skills', s));

      const { data } = await API.put('/auth/profile', formData);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePhoto', file);
    try {
      const { data } = await API.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      toast.success('Photo updated!');
    } catch {
      toast.error('Failed to upload photo');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB');

    const formData = new FormData();
    formData.append('resume', file);
    try {
      const { data } = await API.post('/auth/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      toast.success('Resume uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await API.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    if (profileForm.skills.includes(skill)) return toast.error('Skill already added');
    setProfileForm((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setProfileForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-heading mb-6">My Profile</h1>

      {/* Profile Header Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
              {user?.profile?.profilePhoto ? (
                <img src={user.profile.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-700 font-bold text-2xl">{user?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">{user?.name}</h2>
            <p className="text-slate-500 text-sm truncate">{user?.email}</p>
            <span className={`badge mt-1 capitalize ${
              user?.role === 'admin' ? 'bg-red-100 text-red-700' :
              user?.role === 'recruiter' ? 'bg-purple-100 text-purple-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-full sm:w-fit overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile', Icon: User },
          { id: 'resume', label: 'Resume', Icon: FileText },
          { id: 'password', label: 'Password', Icon: Lock },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="Tell recruiters about yourself..."
                rows={3}
                className="input-field resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">{profileForm.bio.length}/500</p>
            </div>

            {user?.role === 'student' && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="e.g. React, Python..."
                    className="input-field flex-1"
                  />
                  <button type="button" onClick={addSkill} className="btn-secondary flex items-center gap-1 px-3">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileForm.skills.map((skill) => (
                    <span key={skill} className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-lg font-medium">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-primary-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Resume Tab */}
      {activeTab === 'resume' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Resume</h3>

          {user?.profile?.resumeUrl ? (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{user.profile.resumeOriginalName || 'Resume'}</p>
                  <p className="text-sm text-green-600">Uploaded successfully ✓</p>
                </div>
              </div>
              <a href={user.profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                View
              </a>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-700">No resume uploaded yet. Upload one to start applying for jobs.</p>
            </div>
          )}

          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Click to upload resume</p>
              <p className="text-xs text-gray-400 mt-1">PDF up to 5MB</p>
              <input type="file" accept=".pdf,application/pdf" onChange={handleResumeUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
