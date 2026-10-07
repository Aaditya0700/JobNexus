const PAYMENT_KEYWORDS = [
  'registration fee',
  'processing fee',
  'pay to apply',
  'pay for interview',
  'deposit',
  'security deposit',
  'training fee',
  'placement fee',
  'application fee',
  'pay money',
  'send money',
  'pay \u20b9',
  'pay rs',
  'payment required',
  'fee required',
  'money upfront',
  'upfront payment',
  'pay before',
  'pay after selection',
];

const BANK_CREDENTIAL_KEYWORDS = [
  'bank account',
  'upi payment',
  'upi id',
  'otp',
  'card details',
  'credit card',
  'debit card',
  'pin',
  'cvv',
  'net banking',
  'internet banking',
  'cryptocurrency payment',
  'crypto payment',
  'bitcoin payment',
  'wallet address',
  'bank details',
  'account number',
  'ifsc code',
];

const GUARANTEED_JOB_KEYWORDS = [
  'guaranteed job',
  '100% job guarantee',
  'guaranteed placement',
  'guaranteed selection',
  'instant job',
  'guaranteed salary',
  'job guaranteed',
  'placement guaranteed',
  '100% placement',
  'assured job',
  'sure job',
  'definitely get job',
];

const URGENCY_KEYWORDS = [
  'urgent hiring',
  'apply immediately',
  'only today',
  'limited seats',
  'act now',
  'immediate payment',
  'hurry up',
  'last chance',
  'closing soon',
  'few hours left',
  'immediate joining',
  'join today',
];

const VAGUE_DESCRIPTION_INDICATORS = [
  'work from home',
  'easy money',
  'quick money',
  'no experience needed',
  'anyone can apply',
  'simple work',
  'earn daily',
  'earn weekly',
  'part time income',
  'extra income',
];

const POSITIVE_SIGNALS = [
  { key: 'detailed_description', title: 'Detailed job description', description: 'The listing contains meaningful role information.' },
  { key: 'clear_title', title: 'Clear job title', description: 'The job title is specific and professional.' },
  { key: 'clear_company', title: 'Company information provided', description: 'The listing includes a clear company name.' },
  { key: 'clear_location', title: 'Clear location', description: 'The job location is specified.' },
  { key: 'clear_job_type', title: 'Employment type specified', description: 'The listing indicates the job type (full-time, part-time, etc.).' },
  { key: 'clear_experience', title: 'Experience requirements stated', description: 'The listing mentions required experience level.' },
  { key: 'clear_skills', title: 'Skills and requirements listed', description: 'The listing includes specific skills or requirements.' },
  { key: 'reasonable_salary', title: 'Reasonable salary information', description: 'Salary range appears consistent with the role.' },
  { key: 'professional_source', title: 'Professional external source', description: 'The listing comes from a reputable job platform.' },
  { key: 'original_url', title: 'Original job URL available', description: 'You can verify the listing on the source website.' },
  { key: 'structured_info', title: 'Well-structured job information', description: 'The listing follows a professional format.' },
];

function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^\w\s\u20b9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasKeyword(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some(keyword => normalized.includes(normalizeText(keyword)));
}

function analyzeJob(job) {
  const signals = [];
  const warnings = [];
  let score = 50;

  const title = job.title || '';
  const description = job.description || '';
  const company = job.company || '';
  const location = job.location || '';
  const jobType = job.jobType || '';
  const experienceLevel = job.experienceLevel || '';
  const skills = Array.isArray(job.skills) ? job.skills.join(' ') : (job.category || '');
  const requirements = Array.isArray(job.requirements) ? job.requirements.join(' ') : '';
  const responsibilities = Array.isArray(job.responsibilities) ? job.responsibilities.join(' ') : '';
  const salaryMin = job.salaryMin ?? job.salary?.min;
  const salaryMax = job.salaryMax ?? job.salary?.max;
  const redirectUrl = job.redirectUrl || '';

  const fullText = `${title} ${description} ${company} ${location} ${jobType} ${experienceLevel} ${skills} ${requirements} ${responsibilities}`.toLowerCase();

  if (countWords(description) >= 50) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[0] });
    score += 8;
  } else if (countWords(description) >= 20) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[0], description: 'The listing contains a basic job description.' });
    score += 4;
  } else if (countWords(description) < 10 && countWords(description) > 0) {
    warnings.push({ type: 'warning', title: 'Very brief description', description: 'The job description is unusually short and lacks detail.' });
    score -= 10;
  }

  if (title && title.length > 5 && !/^(job|position|opening|vacancy|work|career)$/i.test(title.trim())) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[1] });
    score += 3;
  } else {
    warnings.push({ type: 'warning', title: 'Generic job title', description: 'The job title appears generic or non-specific.' });
    score -= 5;
  }

  if (company && company.length > 2 && !/^(company|employer|organization|firm|business|unknown|confidential)$/i.test(company.trim())) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[2] });
    score += 5;
  } else {
    warnings.push({ type: 'warning', title: 'Missing or generic company name', description: 'The company name is not clearly specified.' });
    score -= 10;
  }

  if (location && location.length > 2) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[3] });
    score += 3;
  } else {
    warnings.push({ type: 'warning', title: 'Location not specified', description: 'The job location is unclear or missing.' });
    score -= 5;
  }

  if (jobType) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[4] });
    score += 2;
  }

  if (experienceLevel) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[5] });
    score += 3;
  }

  const allSkills = `${skills} ${requirements} ${responsibilities}`;
  if (countWords(allSkills) >= 5) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[6] });
    score += 5;
  } else if (countWords(allSkills) > 0) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[6], description: 'The listing mentions some skills or requirements.' });
    score += 2;
  }

  const hasSalary = (salaryMin && salaryMin > 0) || (salaryMax && salaryMax > 0);
  if (hasSalary) {
    let salaryFlagged = false;
    if (salaryMin && salaryMin > 0 && experienceLevel) {
      const expLower = experienceLevel.toLowerCase();
      if ((expLower.includes('entry') || expLower.includes('fresher') || expLower.includes('0')) && salaryMin > 1000000) {
        warnings.push({ type: 'warning', title: 'Unusually high salary for entry level', description: 'The salary appears inconsistent with the experience requirement.' });
        score -= 15;
        salaryFlagged = true;
      }
    }
    if (!salaryFlagged) {
      signals.push({ type: 'positive', ...POSITIVE_SIGNALS[7] });
      score += 5;
    }
  }

  if (job.source === 'adzuna' || redirectUrl) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[8] });
    score += 3;
  }

  if (redirectUrl && redirectUrl.startsWith('http')) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[9] });
    score += 3;
  }

  if (jobType && experienceLevel && company && location) {
    signals.push({ type: 'positive', ...POSITIVE_SIGNALS[10] });
    score += 3;
  }

  if (hasKeyword(fullText, PAYMENT_KEYWORDS)) {
    warnings.push({ type: 'warning', title: 'Payment request detected', description: 'The listing mentions fees or payments required to apply or proceed.' });
    score -= 30;
  }

  if (hasKeyword(fullText, BANK_CREDENTIAL_KEYWORDS)) {
    warnings.push({ type: 'warning', title: 'Sensitive information request', description: 'The listing asks for banking, payment, or credential details.' });
    score -= 25;
  }

  if (hasKeyword(fullText, GUARANTEED_JOB_KEYWORDS)) {
    warnings.push({ type: 'warning', title: 'Guaranteed employment claims', description: 'The listing makes unrealistic promises about job guarantees.' });
    score -= 20;
  }

  if (hasKeyword(fullText, URGENCY_KEYWORDS)) {
    warnings.push({ type: 'warning', title: 'Excessive urgency language', description: 'The listing uses pressure tactics to rush applications.' });
    score -= 5;
  }

  if (hasKeyword(fullText, VAGUE_DESCRIPTION_INDICATORS) && countWords(description) < 100) {
    warnings.push({ type: 'warning', title: 'Vague or generic description', description: 'The description uses generic phrases without specific role details.' });
    score -= 8;
  }

  const wordCount = countWords(description);
  if (wordCount > 0 && wordCount < 100) {
    const nonAlphaRatio = (description.replace(/[a-zA-Z0-9\s]/g, '').length) / description.length;
    if (nonAlphaRatio > 0.3) {
      warnings.push({ type: 'warning', title: 'Unusual formatting detected', description: 'The description contains excessive special characters or formatting issues.' });
      score -= 5;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level, label;
  if (score >= 80) {
    level = 'high';
    label = 'High Trust';
  } else if (score >= 60) {
    level = 'moderate';
    label = 'Moderate Trust';
  } else if (score >= 40) {
    level = 'review';
    label = 'Needs Review';
  } else {
    level = 'suspicious';
    label = 'Suspicious Listing';
  }

  const positiveCount = signals.filter(s => s.type === 'positive').length;
  const warningCount = warnings.length;

  let summary;
  if (level === 'high') {
    summary = 'This listing contains several useful job details and relatively few warning signals.';
  } else if (level === 'moderate') {
    summary = 'This listing has adequate information but some areas could be more detailed.';
  } else if (level === 'review') {
    summary = 'This listing has notable gaps or warning signals that warrant careful review.';
  } else {
    summary = 'This listing shows multiple risk signals. Exercise caution and verify independently before proceeding.';
  }

  return {
    score,
    level,
    label,
    summary,
    signals: signals.map(s => ({ type: s.type, title: s.title, description: s.description })),
    warnings: warnings.map(w => ({ type: w.type, title: w.title, description: w.description })),
  };
}

module.exports = { analyzeJob };