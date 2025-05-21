// Configuration Supabase
const supabaseUrl = 'https://dbksdxqzbbsklzfntfiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRia3NkeHF6YmJza2x6Zm50ZmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzAzOTYsImV4cCI6MjA2MzI0NjM5Nn0.Cv-FBgmwCuzAqd6vThGoancA85C1X8o_GP59oPuxbZg';

// Création du client Supabase - nous vérifions si la bibliothèque est disponible
if (typeof supabase === 'undefined') {
    console.error('La bibliothèque Supabase n\'est pas chargée. Assurez-vous d\'inclure le script Supabase avant supabase-config.js.');
} else {
    // Créer le client Supabase
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // Exposer le client globalement
    window.supabaseClient = supabaseClient;
    console.log('Client Supabase initialisé avec succès');
}