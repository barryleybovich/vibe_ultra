import { supabase } from './supabase';

export async function subscribeToEmails(userId: string) {
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    return { error: selectError };
  }

  if (!existingProfile) {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();

    return supabase.from('profiles').insert({
      id: userId,
      email: user?.email ?? null,
      subscribed_to_emails: true,
      updated_at: new Date().toISOString()
    });
  }
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
export async function createUserProfile(userId: string, email: string) {
  return supabase
    .from('profiles')
    .insert({ id: userId, email });
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