// lib/emailTemplates.ts

import { TodaysWorkoutResult } from './workoutUtils';

export function renderWorkoutEmail(workout: TodaysWorkoutResult, userName?: string): string {
  const title = `🏃‍♂️ Today's Workout: ${workout.training || 'Rest'}`;
  const headerColor = workout.form && workout.form < -0.25 ? '#fecaca' : '#bfdbfe';
  const formColor = workout.form && workout.form < -0.25 ? '#b91c1c' : '#1d4ed8';

  return `
  <html>
    <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
      <table width="100%" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="background: ${headerColor}; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${title}</h1>
            <p style="color: #4b5563; font-size: 14px;">
              ${workout.day}, ${workout.date?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            ${userName ? `<p>Hi ${userName},</p>` : ''}
            <p>Here's your workout for today:</p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Training:</strong> ${workout.
