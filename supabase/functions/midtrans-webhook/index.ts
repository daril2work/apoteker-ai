import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

// Helper: SHA512 using Web Crypto API (available in Deno)
async function sha512(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return new Response('Webhook is alive', { headers: corsHeaders, status: 200 })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { headers: corsHeaders, status: 405 })
  }

  try {
    const bodyText = await req.text()
    if (!bodyText) {
      return new Response('OK (Ping)', { headers: corsHeaders, status: 200 })
    }
    
    const rawBody = JSON.parse(bodyText)
    const { order_id, status_code, gross_amount, transaction_status, signature_key } = rawBody

    // [BUG FIX #2] Verifikasi Signature Midtrans
    // Tanpa ini, siapapun bisa memalsukan notifikasi pembayaran
    const serverKey = (Deno.env.get('MIDTRANS_SERVER_KEY') || '').trim()
    const expectedSignature = await sha512(`${order_id}${status_code}${gross_amount}${serverKey}`)
    
    if (signature_key && expectedSignature !== signature_key) {
      console.error(`Invalid signature. Expected: ${expectedSignature}, Got: ${signature_key}`)
      return new Response('Forbidden: Invalid signature', { status: 403 })
    }

    // Admin client untuk bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Abaikan order selain milik FarmasiKu
    if (!order_id || !order_id.startsWith('PRO-')) {
      return new Response('Ignored: Not a FarmasiKu order', { status: 200 })
    }

    if (transaction_status === 'settlement' || transaction_status === 'capture') {

      // [BUG FIX #1] Baca userId dari tabel subscriptions, bukan parse string order_id
      const { data: sub, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('midtrans_id', order_id)
        .single()
      
      if (subError || !sub) {
        console.error(`Order not found in subscriptions: ${order_id}`, subError)
        return new Response('Order not found', { status: 404 })
      }
      
      const userId = sub.user_id // Full UUID dari database
      
      // 1. Update status di tabel subscriptions
      const expiredAt = new Date()
      expiredAt.setMonth(expiredAt.getMonth() + 1)

      await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: transaction_status,
          expired_at: expiredAt.toISOString()
        })
        .eq('midtrans_id', order_id)

      // 2. Update user metadata tier -> pro
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { tier: 'pro' }
      })

      if (updateError) {
        console.error(`Failed to update user tier for userId: ${userId}`, updateError)
        return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
      }

      console.log(`✅ User ${userId} upgraded to Pro via order ${order_id}`)

      // 3. Send Success Email via Resend (Optional but recommended)
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      if (RESEND_API_KEY) {
        try {
          // Get user email
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
          const userEmail = userData?.user?.email

          if (userEmail) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: 'FarmasiKu <konfirmasi@farmasiku.ai>',
                to: [userEmail],
                subject: 'Pembayaran Pro Berhasil - Selamat Datang di FarmasiKu Pro!',
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0284c7;">Akses Pro Anda Telah Aktif!</h2>
                    <p>Halo,</p>
                    <p>Terima kasih telah berlangganan <strong>FarmasiKu Pro</strong>. Pembayaran untuk pesanan <strong>${order_id}</strong> telah kami terima.</p>
                    <p>Sekarang Anda dapat menikmati fitur:</p>
                    <ul>
                      <li>Skrining & Care Plan Tanpa Batas</li>
                      <li>Ekspor Laporan ke PDF (Kop Instansi & Tanda Tangan)</li>
                      <li>Histori Riwayat hingga 1 Tahun</li>
                    </ul>
                    <p>Silakan refresh aplikasi Anda untuk mulai menggunakan fitur Pro.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.8rem; color: #666;">FarmasiKu AI - Asisten Apoteker Klinis Modern</p>
                  </div>
                `
              })
            })
            console.log(`📧 Confirmation email sent to ${userEmail}`)
          }
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr)
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 400,
    })
  }
})
