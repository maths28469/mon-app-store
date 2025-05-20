// Configuration Supabase
const supabaseUrl = 'https://dbksdxqzbbsklzfntfiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRia3NkeHF6YmJza2x6Zm50ZmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzAzOTYsImV4cCI6MjA2MzI0NjM5Nn0.Cv-FBgmwCuzAqd6vThGoancA85C1X8o_GP59oPuxbZg';

// Créer le client Supabase
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;