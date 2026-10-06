import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  Sparkles, Loader2, AlertTriangle, TrendingUp, Target,
  Award, ShieldCheck, Lightbulb, CheckCircle2, Sparkle,
  Briefcase, GraduationCap, BookOpen, ArrowUpRight,
} from 'lucide-react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const resolveErrorMessage = (error) => {
  const status = error?.response?.status;

  if (!error?.response) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }

  switch (status) {
    case 400:
      return error.response?.data?.message || 'Could not analyze this job. Please check your resume and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'The job match analyzer is only available to student accounts.';
    case 404:
      return error.response?.data?.message || 'That analysis could not be found.';
    case 429:
      return error.response?.data?.message || 'You have reached the hourly analysis limit. Please try again later.';
    default:
      if (status >= 500) {
        return 'Our AI service is busy right now. Please wait a moment and try again.';
      }
      return error.response?.data?.message || 'Something went wrong while analyzing your match.';
  }
};

const scoreTone = (score) => {
  if (score >= 85) return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500', label: 'Strong Match', desc: 'Your profile aligns very well with this role' };
  if (score >= 70) return { bg: 'bg-primary-600', text: 'text-primary-600', border: 'border-primary-500', label: 'Good Match', desc: 'You meet most requirements for this position' };
  if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500', label: 'Partial Match', desc: 'You meet some requirements but have notable gaps' };
  return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500', label: 'Weak Match', desc: 'Significant gaps exist between your profile and this role' };
};

const ScoreRing = ({ score, size = 'lg' }) => {
  const tone = scoreTone(score);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const dims = size === 'sm' ? 'w-20 h-20' : 'w-28 h-28';

  return (
    <div className={`relative ${dims} flex-shrink-0`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${tone.bg} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${size === 'sm' ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>{score}%</span>
      </div>
    </div>
  );
};

const ChipGroup = ({ items, tone = 'matched' }) => {
  if (!items?.length) return (
    <p className="text-sm text-gray-400">None detected</p>
  );
  const toneClasses = {
    matched: 'bg-green-50 text-green-700 border-green-100',
    missing: 'bg-red-50 text-red-700 border-red-100',
    requirement: 'bg-blue-50 text-blue-700 border-blue-100',
    gap: 'bg-amber-50 text-amber-700 border-amber-100',
    recommended: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`badge px-2.5 py-1 text-xs border ${toneClasses[tone] || toneClasses.matched}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

const ListBlock = ({ items, Icon, tone = 'green' }) => {
  if (!items?.length) return null;
  const toneClasses = {
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={`${item}-${i}`} className="flex items-start gap-2.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${toneClasses[tone]}`}>
            <Icon className="w-3 h-3" />
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
};

const MatchRow = ({ label, value, Icon, IconColor = 'gray' }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${IconColor}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{value}</p>
      </div>
    </div>
  );
};

export default function JobMatchAnalysis({ jobId }) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const hasResume = Boolean(user?.profile?.resumeUrl);
  const isPdf = hasResume && /\.pdf$/i.test(user?.profile?.resumeOriginalName || '');

  const fetchAnalysis = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get(`/job-match/${jobId}`);
      if (data?.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(resolveErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleAnalyze = async () => {
    if (analyzing) return;
    if (!hasResume) {
      setError('Upload your resume first to use AI Job Match.');
      return;
    }
    if (!isPdf) {
      setError('The job match analyzer supports PDF files only. Please upload a PDF resume.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const { data } = await API.post(`/job-match/analyze/${jobId}`);
      const result = data?.analysis;

      if (!result || typeof result.matchPercentage !== 'number') {
        throw new Error('malformed');
      }

      setAnalysis(result);
      toast.success('Job match analyzed successfully');
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

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-100 bg-red-50/50">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-800">Unable to load job match</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            {!hasResume && (
              <Link to="/profile" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Upload resume in Profile
              </Link>
            )}
            {!isPdf && hasResume && (
              <Link to="/profile" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Replace with PDF resume
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="card border-primary-100 bg-primary-50/30">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Job Match</h3>
              <p className="text-sm text-gray-500">Compare your resume with this job and discover your match score and skill gaps.</p>
            </div>
          </div>

          {!hasResume && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                No resume uploaded. Upload a PDF resume in your profile to use AI Job Match.
              </p>
            </div>
          )}
          {hasResume && !isPdf && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-sm text-orange-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                The analyzer supports PDF files only. Please upload a PDF resume.
              </p>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !hasResume || !isPdf}
            className="btn-primary w-full sm:w-auto inline-flex items-center gap-2 px-6 py-2.5"
          >
            <Sparkles className="w-4 h-4" />
            Analyze My Match
          </button>
        </div>
      </div>
    );
  }

  const {
    matchPercentage,
    verdict,
    summary,
    matchingSkills,
    missingSkills,
    matchingRequirements,
    missingRequirements,
    skillGaps,
    experienceMatch,
    educationMatch,
    strengths,
    weaknesses,
    recommendedSkills,
    recommendations,
    model,
    createdAt,
  } = analysis;

  const tone = scoreTone(matchPercentage);

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <div className={`card border-l-4 ${tone.border}`}>
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
          <ScoreRing score={matchPercentage} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Target className={`w-5 h-5 ${tone.text}`} />
              <h3 className="font-semibold text-gray-900">AI Job Match</h3>
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tone.bg} text-white`}>
                {tone.label}
              </span>
              <p className="text-sm text-gray-500 mt-2">{tone.desc}</p>
            </div>
            {verdict && (
              <p className="text-sm text-gray-700 mt-2.5 leading-relaxed">{verdict}</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-900">Skills</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Matching</p>
              <ChipGroup items={matchingSkills} tone="matched" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Missing</p>
              <ChipGroup items={missingSkills} tone="missing" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Requirements</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Matched</p>
              <ChipGroup items={matchingRequirements} tone="requirement" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Missing</p>
              <ChipGroup items={missingRequirements} tone="missing" />
            </div>
          </div>
        </div>
      </div>

      {/* Skill Gaps */}
      {skillGaps?.length > 0 && (
        <div className="card border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-4">
            <Sparkle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Skill Gaps</h3>
          </div>
          <ListBlock items={skillGaps} Icon={Briefcase} tone="amber" />
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-900">Strengths</h3>
          </div>
          {strengths?.length > 0 ? (
            <ListBlock items={strengths} Icon={CheckCircle2} tone="green" />
          ) : (
            <p className="text-sm text-gray-400">No specific strengths identified for this role.</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Areas to Improve</h3>
          </div>
          {weaknesses?.length > 0 ? (
            <ListBlock items={weaknesses} Icon={AlertTriangle} tone="red" />
          ) : (
            <p className="text-sm text-gray-400">No significant weaknesses identified.</p>
          )}
        </div>
      </div>

      {/* Experience & Education Match */}
      {(experienceMatch || educationMatch) && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Profile Match</h3>
          </div>
          <div className="space-y-4">
            {experienceMatch && (
              <MatchRow
                label="Experience"
                value={experienceMatch}
                Icon={Briefcase}
                IconColor="bg-primary-500"
              />
            )}
            {educationMatch && (
              <MatchRow
                label="Education"
                value={educationMatch}
                Icon={GraduationCap}
                IconColor="bg-purple-500"
              />
            )}
          </div>
        </div>
      )}

      {/* Recommended Skills */}
      {recommendedSkills?.length > 0 && (
        <div className="card border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Recommended Skills to Learn</h3>
          </div>
          <ChipGroup items={recommendedSkills} tone="recommended" />
        </div>
      )}

      {/* Recommendations */}
      {recommendations?.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Recommendations</h3>
          </div>
          <div className="space-y-2">
            {recommendations.map((item, i) => (
              <div key={`${item}-${i}`} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary-50 text-primary-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with model info */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-400">
        <span>Analyzed by {model || 'Gemini AI'}</span>
        <span>{createdAt ? new Date(createdAt).toLocaleDateString() : 'Just now'}</span>
      </div>
    </div>
  );
}