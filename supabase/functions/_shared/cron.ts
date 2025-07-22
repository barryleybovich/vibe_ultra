// Supabase Edge Functions Cron Configuration
// This file defines the cron schedules for Edge functions

export const cronJobs = [
  {
    name: 'send-daily-workout-email',
    schedule: '0 5 * * *', // Daily at 5:00 AM UTC
    function: 'send-daily-workout-email'
  }
];