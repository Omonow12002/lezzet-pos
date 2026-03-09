import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mlidpbfmpdeoolqcnvxr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saWRwYmZtcGRlb29scWNudnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzgzMDUsImV4cCI6MjA4ODY1NDMwNX0.0ARl0UKgQM58lZ_eLgMzeLMXy7UaEa5ExzK1IXxTuLY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
