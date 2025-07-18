vibe_ultra

## Setup Instructions

To run this application, you need to configure Supabase:

1. Create a Supabase project at https://supabase.com
2. Go to your project settings > API
3. Copy your Project URL and anon/public key
4. Update the `.env` file with your actual values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
5. Restart the development server: `npm run dev`
