import { supabase } from './supabase';

export async function subscribeToEmails(userId: string) {
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error checking existing profile for email subscription:', selectError);
    return { error: selectError };
  }

  if (!existingProfile) {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();

    const result = await supabase.from('profiles').insert({
      id: userId,
      email: user?.email ?? null,
      subscribed_to_emails: true,
      updated_at: new Date().toISOString()
    });
    
    if (result.error) {
      console.error('Error creating profile with email subscription:', result.error);
    }
    return result;
  }
  
  const result = await supabase
    .from('profiles')
    .update({ subscribed_to_emails: true, updated_at: new Date().toISOString() })
    .eq('id', userId);
    
  if (result.error) {
    console.error('Error updating email subscription:', result.error);
  }
  return result;
}

export async function unsubscribeFromEmails(userId: string) {
  const result = await supabase
    .from('profiles')
    .update({ subscribed_to_emails: false, updated_at: new Date().toISOString() })
    .eq('id', userId);
    
  if (result.error) {
    console.error('Error unsubscribing from emails:', result.error);
  }
  return result;
}
export async function createUserProfile(userId: string, email: string) {
  const result = await supabase
    .from('profiles')
    .insert({ id: userId, email });
    
  if (result.error) {
    console.error('Error creating user profile:', result.error);
  }
  return result;
}

export async function upsertTrainingPlan(
  userId: string,
  planName: string,
  planData: any[]
) {
  console.log('Attempting to upsert training plan:', { userId, planName, dataLength: planData.length });
  const result = await supabase
    .from('user_training_plans')
    .upsert(
      { user_id: userId, plan_name: planName, plan_data: planData },
      { onConflict: 'user_id, plan_name' }
    );
    
  if (result.error) {
    console.error('Error upserting training plan:', result.error);
  } else {
    console.log('Successfully upserted training plan');
  }
  return result;
}

export async function upsertFitnessSettings(
  userId: string,
  initialFitness: number,
  initialFatigue: number,
  planStartDate: string
) {
  console.log('Attempting to upsert fitness settings:', { 
    userId, 
    initialFitness, 
    initialFatigue, 
    planStartDate 
  });
  
  const result = await supabase
    .from('user_fitness_settings')
    .upsert({
      user_id: userId,
      initial_fitness: initialFitness,
      initial_fatigue: initialFatigue,
      plan_start_date: planStartDate,
      updated_at: new Date().toISOString()
    });
    
  if (result.error) {
    console.error('Error upserting fitness settings:', result.error);
  } else {
    console.log('Successfully upserted fitness settings:', result.data);
  }
  return result;
}

export async function upsertDailyTSS(
  userId: string,
  workoutDate: string,
  actualTss: number
) {
  const { data, error } = await supabase
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
  
  if (error) {
    console.error('Error upserting daily TSS:', error);
  } else {
    console.log('Successfully upserted daily TSS:', { userId, workoutDate, actualTss });
  }
  
  return { data, error };
}

export async function deleteDailyTSS(userId: string, workoutDate: string) {
  const { data, error } = await supabase
    .from('user_daily_tss_records')
    .delete()
    .match({ user_id: userId, workout_date: workoutDate });
  
  if (error) {
    console.error('Error deleting daily TSS:', error);
  } else {
    console.log('Successfully deleted daily TSS:', { userId, workoutDate });
  }
  
  return { data, error };
}