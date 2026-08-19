import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Check admin role
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Forbidden. Admin only." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const xenditApiKey = Deno.env.get('XENDIT_API_KEY') ?? '';
    if (!xenditApiKey) {
        return new Response(JSON.stringify({ balance: 0, error: "XENDIT_API_KEY not configured" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Call Xendit Balance API
    const authBuffer = btoa(xenditApiKey + ':');
    const response = await fetch('https://api.xendit.co/balance', {
        headers: {
            'Authorization': `Basic ${authBuffer}`
        }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Xendit API Error: ${err}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify({ balance: data.balance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
