// ========================================
// SUPABASE CLIENT CONFIGURATION
// ========================================

// This file initializes the Supabase client.
// It is intended to be included in all HTML pages that interact with Supabase.

// Ensure the Supabase client library is loaded before this script.
// Example: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Replace with your actual Supabase URL and Anon Key
// For production, consider using environment variables or a secure method to inject these.
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose supabase client globally if needed, though direct import is preferred in modern setups.
// For this project's current structure, it's already exposed via `window.supabase.createClient`
// and then assigned to a local `supabase` variable in each script.
// This file primarily serves as a centralized place for the URL and Key.

// You can add more global Supabase related functions here if they are common across multiple pages.


