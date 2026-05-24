const { createClient } = window.supabase;
window.db = createClient(
  'https://gfhuepbnrwqcodquhmcs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaHVlcGJucndxY29kcXVobWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTI5MDUsImV4cCI6MjA5NTIyODkwNX0.nN-mqKtAh7iLbg6x02_eMuWk8HkoClPgrxHPss1DW0c'
);
