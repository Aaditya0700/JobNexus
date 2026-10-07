import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, CheckCircle2, AlertTriangle, Info, Loader2, X } from 'lucide-react';
import { trustCheckAPI } from '../../utils/api';

const getLevelStyle = (level) => {
  switch (level) {
    case 'high':
      return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-600' };
    case 'moderate':
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-600' };
    case 'review':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-600' };
    case 'suspicious':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: 'text-red-600' };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700', icon: 'text-gray-600' };
  }
};

const ScoreBar = ({ score }) => {
  const percentage = Math.max(0, Math.min(100, score));
  return (
    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500 transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const SignalItem = ({ signal, isWarning }) => (
  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-100">
    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
      isWarning ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
    }`}>
      {isWarning ? (
        <AlertTriangle className="w-3 h-3" />
      ) : (
        <CheckCircle2 className="w-3 h-3" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900">{signal.title}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{signal.description}</p>
    </div>
  </div>
);

export default function TrustCheck({ jobId, externalJobId, isExternal = false }) {
  const [trustCheck, setTrustCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrustCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (isExternal) {
        const response = await trustCheckAPI.getExternalJobTrust(externalJobId);
        data = response.data;
      } else {
        const response = await trustCheckAPI.getInternalJobTrust(jobId);
        data = response.data;
      }
      if (data?.trustCheck) {
        setTrustCheck(data.trustCheck);
      }
    } catch (err) {
      console.error('TrustCheck fetch error:', err);
      setError('TrustCheck unavailable');
    } finally {
      setLoading(false);
    }
  }, [jobId, externalJobId, isExternal]);

  useEffect(() => {
    fetchTrustCheck();
  }, [fetchTrustCheck]);

  if (loading) {
    return (
      <div className={`card ${isExternal ? 'border-amber-100' : 'border-primary-100'}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-gray-500">Analyzing trust signals...</span>
        </div>
      </div>
    );
  }

  if (error || !trustCheck) {
    return (
      <div className="card border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 p-4">
          <Info className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-700">TrustCheck unavailable</p>
            <p className="text-sm text-gray-500 mt-1">Unable to analyze this listing at the moment. You can still review the job details.</p>
          </div>
        </div>
      </div>
    );
  }

  const { score, level, label, summary, signals, warnings } = trustCheck;
  const style = getLevelStyle(level);

  return (
    <div className={`card border-l-4 ${style.border} ${style.bg}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-8">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: style.badge.replace('bg-', 'bg-').replace('text-', 'bg-') }}>
            <Shield className={`w-7 h-7 ${style.icon}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">JobNexus TrustCheck</h3>
              <span className={`badge px-2.5 py-1 text-xs font-medium ${style.badge}`}>{label}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Risk assessment for this job listing</p>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="w-48 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Trust Score</span>
              <span className={`text-lg font-bold ${style.text}`}>{score}/100</span>
            </div>
            <ScoreBar score={score} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
      </div>

      {(signals?.length > 0 || warnings?.length > 0) && (
        <div className="mt-5 space-y-4">
          {signals?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className={`w-4 h-4 ${style.icon}`} />
                <h4 className="font-medium text-gray-900">Trust Signals</h4>
              </div>
              <div className="space-y-2">
                {signals.map((signal, i) => (
                  <SignalItem key={i} signal={signal} isWarning={false} />
                ))}
              </div>
            </div>
          )}

          {warnings?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-medium text-gray-900">Things to Review</h4>
              </div>
              <div className="space-y-2">
                {warnings.map((warning, i) => (
                  <SignalItem key={i} signal={warning} isWarning={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}