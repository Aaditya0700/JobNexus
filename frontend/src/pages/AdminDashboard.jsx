import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Users, Briefcase, Building2, TrendingUp,
  Loader2, Shield, ToggleLeft, ToggleRight, Trash2, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import API from '../utils/api';

const TABS = ['Overview', 'Users', 'Jobs'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'Users') fetchUsers();
    if (activeTab === 'Jobs') fetchJobs();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/admin/stats');
      setStats(data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchUser) params.search = searchUser;
      const { data } = await API.get('/admin/users', { params });
      setUsers(data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/admin/jobs');
      setJobs(data.jobs);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (id) => {
    try {
      const { data } = await API.put(`/admin/users/${id}/toggle`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: data.user.isActive } : u));
      toast.success(data.message);
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 min-w-0">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="page-heading">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Manage users, jobs and platform activity</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit max-w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 motion-stagger">
                {[
                  { label: 'Total Users', value: stats?.stats.totalUsers, icon: Users, color: 'bg-blue-100 text-blue-600' },
                  { label: 'Total Jobs', value: stats?.stats.totalJobs, icon: Briefcase, color: 'bg-primary-100 text-primary-600' },
                  { label: 'Applications', value: stats?.stats.totalApplications, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
                  { label: 'Companies', value: stats?.stats.totalCompanies, icon: Building2, color: 'bg-purple-100 text-purple-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
                    <p className="text-sm text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 motion-stagger">
                {/* Role Breakdown */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">User Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Students', value: stats?.stats.studentCount, color: 'bg-blue-500' },
                      { label: 'Recruiters', value: stats?.stats.recruiterCount, color: 'bg-purple-500' },
                      { label: 'Active Jobs', value: stats?.stats.activeJobs, color: 'bg-green-500' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-sm text-gray-600">{label}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{value ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {stats?.recentUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <span className={`badge capitalize ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'recruiter' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'Users' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search by name or email..."
              className="input-field flex-1"
            />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); }}
              className="input-field sm:w-40"
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={fetchUsers} className="btn-primary">Search</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">User</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Role</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Joined</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`badge capitalize ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'recruiter' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                      <td className="py-3 px-2">
                        <span className={`badge ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleUser(user._id)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Toggle status">
                            {user.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDeleteUser(user._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-center text-gray-500 py-8">No users found</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'Jobs' && (
        <div className="card">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Job</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Company</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Posted By</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.jobType} · {job.location}</p>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{job.company?.name}</td>
                      <td className="py-3 px-2 text-gray-600">{job.createdBy?.name}</td>
                      <td className="py-3 px-2">
                        <span className={`badge ${
                          job.status === 'active' ? 'bg-green-100 text-green-700' :
                          job.status === 'closed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500">{format(new Date(job.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {jobs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No jobs found</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
