import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://abtdhwvkftphtzgtqqju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidGRod3ZrZnRwaHR6Z3RxcWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDk0NTAsImV4cCI6MjA4OTk4NTQ1MH0.esKMjIN1y8rrNpV1aoXbUsG4syUYaP83GkdbnUKJjcc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
