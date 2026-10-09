export const isJobSaved = (savedJobs, jobId) =>
  Array.isArray(savedJobs) && savedJobs.some((savedJob) => {
    const savedId = typeof savedJob === 'string' ? savedJob : savedJob?._id;
    return savedId != null && String(savedId) === String(jobId);
  });
