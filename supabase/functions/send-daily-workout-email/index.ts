// Cron schedule: Run daily at 5:00 AM UTC
// This function will be invoked automatically by Supabase's cron scheduler

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkoutData {
  found: boolean;
  day?: string;
  date?: Date;
  training?: string;
  description?: string;
  plannedTSS?: number;
  actualTSS?: number;
  effectiveTSS?: number;
  fitness?: number;
  fatigue?: number;
  form?: number;
  weekNumber?: string;
  weekOf?: string;
  status?: 'before' | 'after' | 'unknown';
}

function estimateTSS(training: string, description: string): number {
  if (training.toLowerCase() === 'rest' || training.toLowerCase().includes('travel')) {
    return 0;
  }

  if (training.toLowerCase().includes('x-train') || training.toLowerCase() === 'x-train') {
    return 22.5;
  }

  const miles = parseFloat(training);
  if (!isNaN(miles) && miles > 0) {
    const desc = description.toLowerCase();
    const hardKeywords = ['hard', 'threshold', 'tempo', '10k', '5k', 'vo2', 'fast', 'hills', 'ladder'];
    const moderateKeywords = ['aerobic', 'hm effort', 'race pace', 'fartlek'];

    const isHard = hardKeywords.some(keyword => desc.includes(keyword));
    const isModerate = moderateKeywords.some(keyword => desc.includes(keyword)) && !isHard;

    if (desc.includes('up,') || desc.includes('down') || desc.includes('easy,')) {
      if (isHard) {
        return Math.round(miles * 0.3 * 8 + miles * 0.7 * 11);
      } else if (isModerate) {
        return Math.round(miles * 0.3 * 8 + miles * 0.7 * 9.5);
      }
    }

    if (isHard) {
      return Math.round(miles * 11);
    } else if (isModerate) {
      return Math.round(miles * 9.5);
    } else {
      return Math.round(miles * 8);
    }
  }

  if (description.toLowerCase().includes('50k')) {
    return 350;
  }
  if (description.toLowerCase().includes('100k')) {
    return 600;
  }

  return 0;
}

function getTodaysWorkout(data: any[], planStartDate: Date, initialFitness: number, initialFatigue: number, actualTSSData: Record<string, number>, targetDate: Date): WorkoutData {
  const today = new Date(targetDate);
  today.setHours(0, 0, 0, 0);

  let currentFitness = initialFitness;
  let currentFatigue = initialFatigue;

  for (let i = 0; i < data.length; i += 2) {
    const weekRow = data[i];
    const descriptionRow = data[i + 1];

    if (!weekRow || !descriptionRow) continue;

    const weekIndex = Math.floor(i / 2);
    const weekStartDate = new Date(planStartDate);
    weekStartDate.setDate(planStartDate.getDate() + weekIndex * 7);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex];
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + dayIndex);
      dayDate.setHours(0, 0, 0, 0);

      const training = weekRow[day] || '';
      const description = descriptionRow[day] || '';
      const plannedTSS = estimateTSS(training, description);
      const workoutKey = `${weekIndex}-${dayIndex}`;
      const actualTSS = actualTSSData[workoutKey];
      const effectiveTSS = actualTSS ?? plannedTSS;

      const fitnessAlpha = 2 / (42 + 1);
      const fatigueAlpha = 2 / (7 + 1);

      currentFitness = currentFitness + fitnessAlpha * (effectiveTSS - currentFitness);
      currentFatigue = currentFatigue + fatigueAlpha * (effectiveTSS - currentFatigue);

      const form = currentFatigue > 0 ? (currentFitness - currentFatigue) / currentFitness : 0;

      if (dayDate.getTime() === today.getTime()) {
        return {
          found: true,
          day,
          date: dayDate,
          training,
          description,
          plannedTSS,
          actualTSS,
          effectiveTSS,
          fitness: currentFitness,
          fatigue: currentFatigue,
          form,
          weekNumber: weekRow['Week #'] || '',
          weekOf: weekStartDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        };
      }
    }
  }

  const planStart = new Date(planStartDate);
  planStart.setHours(0, 0, 0, 0);

  if (today < planStart) return { found: false, status: 'before' };

  const totalWeeks = Math.ceil(data.length / 2);
  const planEnd = new Date(planStartDate);
  planEnd.setDate(planStartDate.getDate() + totalWeeks * 7 - 1);
  planEnd.setHours(0, 0, 0, 0);

  if (today > planEnd) return { found: false, status: 'after' };

  return { found: false, status: 'unknown' };
}

function generateEmailHTML(workout: WorkoutData, userEmail: string): string {
  const isLowForm = workout.form && workout.form < -0.25;
  const formColor = isLowForm ? '#dc2626' : '#2563eb';

  const dateString = workout.date
    ? workout.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (!workout.found) {
    const message = workout.status === 'before'
      ? "Your training plan hasn't started yet. Consider easy base training, cross-training, or rest."
      : workout.status === 'after'
      ? "Congratulations! You've completed your training plan. Time for a new challenge!"
      : "No workout scheduled for today.";

    return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center" style="padding:20px;">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
        </tr>
        <tr>
          <td style="background:#3b82f6;color:#ffffff;padding:10px;text-align:center;font-size:18px;font-weight:bold;">🏃‍♂️ Daily Workout Update</td>
        </tr>
        <tr>
          <td style="padding:24px;text-align:center;font-size:14px;color:#374151;">${message}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center" style="padding:20px;">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
        <tr>
<td style="background:#3b82f6;color:#ffffff;padding:16px;text-align:center;font-size:18px;font-weight:bold;">🏃‍♂️ Today's Workout - ${dateString}</td>
        </tr>
        <tr>
          <td style="padding:24px;font-size:14px;color:#374151;">
            <p style="margin:0 0 8px;"><strong>Training:</strong> ${workout.training || 'Rest'}</p>
            ${workout.plannedTSS > 0 || workout.actualTSS !== undefined ? `
            <p style="margin:0 0 8px;"><strong>TSS:</strong> ${workout.actualTSS !== undefined ? `${workout.actualTSS} (planned ${workout.plannedTSS})` : workout.plannedTSS}</p>` : ``}
            <p style="margin:0 0 8px;"><strong>Week:</strong> ${workout.weekNumber}</p>
            ${workout.description ? `<p style="margin:12px 0 0;">${workout.description}</p>` : ``}
            <div style="margin-top:16px;text-align:center;">
              <span style="display:inline-block;margin:0 8px;color:#10b981;"><strong>Fitness:</strong> ${workout.fitness?.toFixed(1)}</span>
              <span style="display:inline-block;margin:0 8px;color:#ef4444;"><strong>Fatigue:</strong> ${workout.fatigue?.toFixed(1)}</span>
              <span style="display:inline-block;margin:0 8px;color:${formColor};"><strong>Form:</strong> ${((workout.form || 0) * 100).toFixed(0)}%</span>
            </div>
            ${isLowForm ? `<p style="margin-top:16px;color:#dc2626;text-align:center;">⚠️ Low form detected - consider easier training or rest</p>` : ``}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users who are subscribed to emails
    const { data: subscribers, error: subscribersError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .eq('subscribed_to_emails', true)

    if (subscribersError) {
      throw subscribersError
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscribers found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const today = new Date()
    const emailsSent = []

    for (const subscriber of subscribers) {
      try {
        // Get user's training plan
        const { data: trainingPlan, error: planError } = await supabaseClient
          .from('user_training_plans')
          .select('plan_data')
          .eq('user_id', subscriber.id)
          .eq('plan_name', 'default')
          .single()

        if (planError || !trainingPlan) {
          console.log(`No training plan found for user ${subscriber.id}`)
          continue
        }

        // Get user's fitness settings
        const { data: fitnessSettings, error: fitnessError } = await supabaseClient
          .from('user_fitness_settings')
          .select('initial_fitness, initial_fatigue, plan_start_date')
          .eq('user_id', subscriber.id)
          .single()

        if (fitnessError || !fitnessSettings) {
          console.log(`No fitness settings found for user ${subscriber.id}`)
          continue
        }

        // Get user's actual TSS data
        const { data: tssRecords, error: tssError } = await supabaseClient
          .from('user_daily_tss_records')
          .select('workout_date, actual_tss')
          .eq('user_id', subscriber.id)

        if (tssError) {
          console.log(`Error fetching TSS data for user ${subscriber.id}:`, tssError)
        }

        // Convert TSS records to the format expected by getTodaysWorkout
        const actualTSSData: Record<string, number> = {}
        if (tssRecords) {
          const planStartDate = new Date(fitnessSettings.plan_start_date)
          tssRecords.forEach(record => {
            const recordDate = new Date(record.workout_date)
            const daysDiff = Math.floor((recordDate.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24))
            const weekIndex = Math.floor(daysDiff / 7)
            const dayIndex = daysDiff % 7
            const workoutKey = `${weekIndex}-${dayIndex}`
            actualTSSData[workoutKey] = record.actual_tss
          })
        }

        // Get today's workout
        const todaysWorkout = getTodaysWorkout(
          trainingPlan.plan_data,
          new Date(fitnessSettings.plan_start_date),
          fitnessSettings.initial_fitness,
          fitnessSettings.initial_fatigue,
          actualTSSData,
          today
        )

        // Generate email HTML
        const emailHTML = generateEmailHTML(todaysWorkout, subscriber.email)
        // Build the subject line and append "miles" when appropriate
        let subjectTraining = todaysWorkout.training || 'Rest'
        if (!isNaN(Number(subjectTraining)) && subjectTraining.trim() !== '') {
          subjectTraining = `${subjectTraining} miles`
        }

        
        // Send email via Loop.so
        const loopResponse = await fetch('https://app.loops.so/api/v1/transactional', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOOPS_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionalId: 'cmd9q4yam4f9q0o0ib9eu6he1',
            email: subscriber.email,
            dataVariables: {
              html: emailHTML,
              subject: todaysWorkout.found 
                ? `🏃‍♂️ Today's Workout: ${subjectTraining}`
                : '🏃‍♂️ Daily Workout Update'
            }
          }),
        })

        if (loopResponse.ok) {
          emailsSent.push(subscriber.email)
          console.log(`Email sent successfully to ${subscriber.email}`)
        } else {
          const errorText = await loopResponse.text()
          console.error(`Failed to send email to ${subscriber.email}:`, errorText)
        }

      } catch (error) {
        console.error(`Error processing user ${subscriber.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${subscribers.length} subscribers, sent ${emailsSent.length} emails`,
        emailsSent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-daily-workout-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})