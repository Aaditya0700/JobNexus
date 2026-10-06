import React from 'react';
import {
  CheckCircle2, TrendingUp, Target, Award, Lightbulb, ShieldCheck,
} from 'lucide-react';

// Score buckets drive colour, bar fill and the plain-language verdict
const scoreTone = (score) => {
  if (score >= 85) return { bar: 'bg-green-500', text: 'text-green-600', ring: 'text-green-600' };
  if (score >= 70) return { bar: 'bg-primary-600', text: 'text-primary-600', ring: 'text-primary-600' };
  if (score >= 50) return { bar: 'bg-yellow-500', text: 'text-yellow-600', ring: 'text-yellow-600' };
  return { bar: 'bg-red-500', text: 'text-red-600', ring: 'text-red-600' };
};

const scoreLabel = (score) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs work';
  return 'Poor';
};

const ScoreBar = ({ label, score, hint }) => {
  const tone = scoreTone(score);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${tone.text}`}>{score}%</span>
      </div>
      <div
        className="h-2 w-full bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full ${tone.bar} transition-all duration-700`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
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
          className={`${tone.ring} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${size === 'sm' ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>{score}</span>
        <span className="text-[10px] text-gray-400 font-medium">out of 100</span>
      </div>
    </div>
  );
};

const ChipGroup = ({ items, matched }) => {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`badge ${matched ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

const ListBlock = ({ items, Icon, tone }) => {
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

export default function AnalysisResults({ analysis }) {
  if (!analysis) return null;

  const {
    overallScore,
    atsScore,
    summary,
    sections,
    skills,
    keywords,
    strengths,
    suggestions,
    jobMatch,
  } = analysis;

  // jobMatch is only present when the analysis was run against a target job
  const hasJobMatch = jobMatch && typeof jobMatch.score === 'number';
  const jobTitle = analysis.job?.title;

  return (
    <div className="space-y-6">
      {/* Headline scores */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <ScoreRing score={overallScore} />
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Overall Score</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{scoreLabel(overallScore)}</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[16rem]">
                {overallScore >= 70
                  ? 'Your resume is in good shape. Work through the suggestions below to push it higher.'
                  : 'Focus on the suggestions below to strengthen the weakest areas first.'}
              </p>
            </div>
          </div>

          <div className="hidden sm:block w-px self-stretch bg-gray-100" />

          <div className="flex-1 w-full">
            <ScoreBar
              label="ATS Compatibility"
              score={atsScore}
              hint="How cleanly an Applicant Tracking System can parse this resume. Multi-column layouts, tables and images all lower this score."
            />
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

      {/* Job match */}
      {hasJobMatch && (
        <div className="card border-l-4 border-l-purple-500">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <ScoreRing score={jobMatch.score} size="sm" />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-900">
                  Job Match{jobTitle ? ` — ${jobTitle}` : ''}
                </h3>
              </div>
              {jobMatch.verdict && (
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{jobMatch.verdict}</p>
              )}
            </div>
          </div>

          {jobMatch.missingRequirements?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2.5">Requirements not evidenced</p>
              <ChipGroup items={jobMatch.missingRequirements} matched={false} />
            </div>
          )}
        </div>
      )}

      {/* Section breakdown */}
      {sections?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Section Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {sections.map((section) => (
              <div key={section.name} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0 md:first:border-t md:first:pt-4">
                <ScoreBar label={section.name} score={section.score} />
                {section.feedback && (
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{section.feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills and keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Skills</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Matched</p>
              {skills?.matched?.length > 0 ? (
                <ChipGroup items={skills.matched} matched />
              ) : (
                <p className="text-sm text-gray-400">No skills detected in your resume.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Missing</p>
              {skills?.missing?.length > 0 ? (
                <ChipGroup items={skills.missing} matched={false} />
              ) : (
                <p className="text-sm text-gray-400">Nothing missing that we could detect.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-gray-900">ATS Keywords</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Present</p>
              {keywords?.matched?.length > 0 ? (
                <ChipGroup items={keywords.matched} matched />
              ) : (
                <p className="text-sm text-gray-400">No recruiter keywords detected.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Absent</p>
              {keywords?.missing?.length > 0 ? (
                <ChipGroup items={keywords.missing} matched={false} />
              ) : (
                <p className="text-sm text-gray-400">No missing keywords detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strengths and suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-900">Strengths</h3>
          </div>
          {strengths?.length > 0 ? (
            <ListBlock items={strengths} Icon={CheckCircle2} tone="green" />
          ) : (
            <p className="text-sm text-gray-400">No strengths were identified.</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900">How to Improve</h3>
          </div>
          {suggestions?.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map((item, i) => (
                <div key={`${item}-${i}`} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No suggestions were returned.</p>
          )}
        </div>
      </div>
    </div>
  );
}