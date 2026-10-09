import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    // A 401 from a protected feature can be expected for anonymous visitors
    // (for example, AI match history on a public job detail page). Only clear
    // the session and redirect when this request actually used a bearer token.
    if (err.response?.status === 401 && err.config?.headers?.Authorization) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const externalJobsAPI = {
  getJobs: (params) => API.get('/external-jobs', { params }),
  getJob: (externalId) => API.get(`/external-jobs/${externalId}`),
};

export const savedExternalJobsAPI = {
  getAll: () => API.get('/saved-external-jobs'),
  save: (job) => API.post('/saved-external-jobs', job),
  unsave: (externalJobId) => API.delete(`/saved-external-jobs/${externalJobId}`),
};

export const jobMatchAPI = {
  analyzeExternalJob: (externalJobId) => API.post(`/job-match/analyze/external/${externalJobId}`),
  getExternalJobMatch: (externalJobId) => API.get(`/job-match/external/${externalJobId}`),
};

export const trustCheckAPI = {
  getInternalJobTrust: (jobId) => API.get(`/trust-check/job/${jobId}`),
  getExternalJobTrust: (externalJobId) => API.get(`/trust-check/external/${externalJobId}`),
};

export default API;
