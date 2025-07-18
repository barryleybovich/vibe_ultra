import { supabase } from './supabase';

export async function subscribeToEmails(userId: string) {
  return supabase
    .from('profiles')
    .update({ subscribed_to_emails: true, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function unsubscribeFromEmails(userId: string) {
  return supabase
    .from('profiles')
    .update({ subscribed_to_emails: false, updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function upsertTrainingPlan(
  userId: string,
  planName: string,
  planData: any[]
) {
  return supabase
    .from('user_training_plans')
    .upsert(
      { user_id: userId, plan_name: planName, plan_data: planData },
      { onConflict: 'user_id, plan_name' }
    );
}

export async function upsertFitnessSettings(
  userId: string,
  initialFitness: number,
  initialFatigue: number,
  planStartDate: string
) {
  return supabase
    .from('user_fitness_settings')
    .upsert({
      user_id: userId,
      initial_fitness: initialFitness,
      initial_fatigue: initialFatigue,
      plan_start_date: planStartDate,
      updated_at: new Date().toISOString()
    });
}

export async function upsertDailyTSS(
  userId: string,
  workoutDate: string,
  actualTss: number
) {
  return supabase
    .from('user_daily_tss_records')
    .upsert(
      {
        user_id: userId,
        workout_date: workoutDate,
        actual_tss: actualTss,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id, workout_date' }
    );
}

export async function deleteDailyTSS(userId: string, workoutDate: string) {
  return supabase
    .from('user_daily_tss_records')
    .delete()
    .match({ user_id: userId, workout_date: workoutDate });
}