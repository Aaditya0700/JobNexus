import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Sparkles, FileText, Loader2, Upload, AlertTriangle, History,
  ChevronRight, Inbox, ShieldCheck, Clock,
} from 'lucide-react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AnalysisResults from '../components/resume/AnalysisResults';

// Maps backend failures onto messages a student can act on
const resolveErrorMessage = (error) => {
  const status = error?.response?.status;

  if (!error?.response) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }

  switch (status) {
    case 400:
      return error.response?.data?.message || 'Your resume could not be analyzed. Please check that it is a PDF file.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'The resume analyzer is only available to student accounts.';
    case 404:
      return error.response?.data?.message || 'That analysis could not be found.';
    case 429:
      return error.response?.data?.message || 'You have reached the hourly analysis limit. Please try again later.';
    default:
      if (status >= 500) {
        return 'Our AI service is busy right now. Please wait a moment and try again.';
      }
      return error.response?.data?.message || 'Something went wrong while analyzing your resume.';
  }
};

const isPdfResume = (name) => typeof name === 'string' && /\.pdf$/i.test(name);

export default function ResumeAnalyzerPage() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [error, setError] = useState(null);

  const resumeUrl = user?.profile?.resumeUrl;
  const resumeName = user?.profile?.resumeOriginalName;
  const hasResume = Boolean(resumeUrl);
  const isPdf = isPdfResume(resumeName);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await API.get('/resume-analysis');
      setHistory(data?.analyses || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleAnalyze = async () => {
    if (analyzing) return;

    setAnalyzing(true);
    setError(null);

    try {
      const { data } = await API.post('/resume-analysis/analyze', {});
      const result = data?.analysis;

      // The backend always returns a document, but guard against a shape we
      // cannot render rather than showing a broken dashboard
      if (!result || typeof result.overallScore !== 'number') {
        throw new Error('malformed');
      }

      setAnalysis(result);
      toast.success('Resume analyzed successfully');
      fetchHistory();
    } catch (err) {
      const message = err.message === 'malformed'
        ? 'The analyzer returned an unexpected result. Please try again.'
        : resolveErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOpen = async (id) => {
    setOpeningId(id);
    try {
      const { data } = await API.get(`/resume-analysis/${id}`);
      if (data?.analysis) {
        setAnalysis(data.analysis);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      const message = resolveErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Resume Intelligence</h1>
          <p className="text-gray-500 text-sm">Skill Gap Analyzer — get an instant recruiter-style review</p>
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-3xl">
        Our analyzer reads the resume you have already uploaded to your profile and scores it the way a
        recruiter and an Applicant Tracking System would. You get an overall score, an ATS compatibility
        score, a breakdown of every section, the skills and keywords you have matched, and a prioritised
        list of concrete improvements.
      </p>

      {/* Two-column: resume status + analyze action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        {/* Resume status */}
        <div className="lg:col-span-7 card flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                !hasResume ? 'bg-yellow-50' : isPdf ? 'bg-green-50' : 'bg-orange-50'
              }`}
            >
              {!hasResume ? (
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              ) : isPdf ? (
                <FileText className="w-6 h-6 text-green-600" />
              ) : (
                <FileText className="w-6 h-6 text-orange-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {hasResume ? resumeName || 'Resume uploaded' : 'No resume uploaded yet'}
              </p>
              <p className="text-sm text-gray-500">
                {!hasResume
                  ? 'Upload a PDF resume in your profile before running the analyzer.'
                  : isPdf
                    ? 'Your resume is ready to analyze.'
                    : 'The analyzer supports PDF files only. Please upload a PDF resume.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {hasResume && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm inline-flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" /> View
                </a>
              )}
              <Link to="/profile" className="btn-secondary text-sm inline-flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                {hasResume ? 'Replace' : 'Upload'}
              </Link>
            </div>
          </div>
        </div>

        {/* Analyze action */}
        <div className="lg:col-span-5 card flex flex-col justify-center">
          {analyzing ? (
            <div>
              <div className="flex items-start gap-3">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Analyzing your resume with AI...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This usually takes 15 to 30 seconds. Please keep this page open.
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5" aria-hidden="true">
                {[100, 85, 92, 70].map((width, i) => (
                  <div
                    key={i}
                    className="h-3 bg-gray-200/70 rounded-full animate-pulse"
                    style={{ width: `${width}%`, animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={handleAnalyze}
              disabled={!hasResume || !isPdf}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 px-6 py-3"
            >
              <Sparkles className="w-4 h-4" />
              {analysis ? 'Analyze Again' : 'Analyze My Resume'}
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Analysis failed</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-sm font-medium flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Results */}
      {analysis && !analyzing && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(analysis.createdAt || Date.now()), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          <AnalysisResults analysis={analysis} />
        </div>
      )}

      {/* Previous analyses */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Previous Analyses</h2>
        </div>

        {loadingHistory ? (
          <div className="card flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="card text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900">No previous analyses</p>
            <p className="text-sm text-gray-500 mt-1">
              Run the analyzer and your results will be saved here for reference.
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
            {history.map((item) => (
              <button
                key={item._id}
                onClick={() => handleOpen(item._id)}
                disabled={openingId === item._id}
                className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {openingId === item._id ? (
                    <Loader2 className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    </Loader2>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4 text-primary-600" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {item.job?.title || 'General Resume Review'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">{item._id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Overall</p>
                    <p className="text-sm font-bold text-gray-900">{item.overallScore}%</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">ATS</p>
                    <p className="text-sm font-bold text-gray-900">{item.atsScore}%</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</p>
                    <p className="text-sm text-gray-700">{format(new Date(item.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasResume && (
        <div className="mt-6 flex items-start gap-2.5 text-sm text-gray-500">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p>
            The analyzer always reads the resume stored on your profile, so upload or replace your PDF resume
            there first.{' '}
            <Link to="/profile" className="text-primary-600 hover:text-primary-700 font-medium">
              Go to your profile
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}