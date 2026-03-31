import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const midtransServerKey = (Deno.env.get('MIDTRANS_SERVER_KEY') || '').trim()
const isProduction = midtransServerKey.startsWith('Mid-')
const midtransEndpoint = isProduction 
  ? 'https://app.midtrans.com/snap/v1/transactions' 
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No Authorization header" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Client dengan ANON_KEY untuk verifikasi user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: " + (userError?.message || "No user found") }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Admin client dengan SERVICE_ROLE_KEY untuk write ke DB
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // [BUG FIX #1] Order ID pendek agar tidak melebihi limit Midtrans (50 char)
    // Format: PRO-{8 char user id}-{timestamp} = ~30 chars, aman
    const orderId = `PRO-${user.id.slice(0, 8)}-${Date.now()}`
    
    const authString = btoa(`${midtransServerKey}:`)
    
    const snapResponse = await fetch(midtransEndpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: 79000
        },
        customer_details: {
          first_name: user.user_metadata?.full_name || 'Apoteker',
          email: user.email,
        },
        callbacks: {
          finish: isProduction ? 'https://farmasiku.app' : 'http://localhost:5173'
        }
      })
    })

    const snapData = await snapResponse.json()
    
    if (!snapResponse.ok) {
      return new Response(JSON.stringify({ 
        error: `Midtrans API ${snapResponse.status}: ${snapData.error_messages ? snapData.error_messages.join(', ') : JSON.stringify(snapData)}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!snapData.token) {
      return new Response(JSON.stringify({ error: 'Snap token missing in Midtrans response' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // [BUG FIX #1] Simpan mapping {order_id -> user_id penuh} ke tabel subscriptions
    // Webhook akan membaca tabel ini untuk mendapatkan userId yang benar
    await supabaseAdmin.from('subscriptions').insert({
      user_id: user.id,        // Full UUID, bukan 8 karakter!
      midtrans_id: orderId,
      status: 'pending',
    })
    
    return new Response(JSON.stringify({ token: snapData.token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("Critical Function Error:", error)
    return new Response(JSON.stringify({ 
      error: error.message || "Internal Server Error",
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
