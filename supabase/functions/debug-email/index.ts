import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('🔍 Starting email debug investigation...')

    // Check environment variables
    const hasSupabaseUrl = !!Deno.env.get('SUPABASE_URL')
    const hasServiceKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const hasLoopsKey = !!Deno.env.get('LOOPS_API_KEY')

    console.log('Environment variables:', {
      SUPABASE_URL: hasSupabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: hasServiceKey,
      LOOPS_API_KEY: hasLoopsKey
    })

    // Check for subscribers
    const { data: subscribers, error: subscribersError } = await supabaseClient
      .from('profiles')
      .select('id, email, subscribed_to_emails')

    console.log('All profiles:', subscribers)
    console.log('Subscribers error:', subscribersError)

    const subscribedUsers = subscribers?.filter(s => s.subscribed_to_emails) || []
    console.log('Subscribed users:', subscribedUsers)

    // Check training plans
    const { data: trainingPlans, error: plansError } = await supabaseClient
      .from('user_training_plans')
      .select('user_id, plan_name, created_at')

    console.log('Training plans:', trainingPlans)
    console.log('Plans error:', plansError)

    // Check fitness settings
    const { data: fitnessSettings, error: fitnessError } = await supabaseClient
      .from('user_fitness_settings')
      .select('user_id, plan_start_date, updated_at')

    console.log('Fitness settings:', fitnessSettings)
    console.log('Fitness error:', fitnessError)

    // Test Loops.so API connection
    let loopsTest = null
    if (hasLoopsKey) {
      try {
        const loopsResponse = await fetch('https://app.loops.so/api/v1/contacts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOOPS_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        })
        loopsTest = {
          status: loopsResponse.status,
          ok: loopsResponse.ok,
          statusText: loopsResponse.statusText
        }
      } catch (error) {
        loopsTest = { error: error.message }
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        SUPABASE_URL: hasSupabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: hasServiceKey,
        LOOPS_API_KEY: hasLoopsKey
      },
      database: {
        totalProfiles: subscribers?.length || 0,
        subscribedUsers: subscribedUsers.length,
        subscribedEmails: subscribedUsers.map(u => u.email),
        trainingPlansCount: trainingPlans?.length || 0,
        fitnessSettingsCount: fitnessSettings?.length || 0,
        errors: {
          subscribers: subscribersError,
          plans: plansError,
          fitness: fitnessError
        }
      },
      loopsApiTest: loopsTest
    }

    console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2))

    return new Response(
      JSON.stringify(debugInfo, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Debug function error:', error)
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})