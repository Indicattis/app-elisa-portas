import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role, ativo')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminUser || !adminUser.ativo) {
      throw new Error('Access denied - admin only')
    }

    const { action } = await req.json()

    if (action === 'vacuum_full') {
      return await vacuumDatabase(supabase)
    } else if (action === 'analyze_storage') {
      return await analyzeStorage(supabase)
    } else {
      throw new Error('Invalid action specified')
    }

  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function vacuumDatabase(supabase: any) {
  console.log('Starting database vacuum...')
  
  try {
    // Execute VACUUM FULL on tables that had large base64 data
    const { error: vacuumError } = await supabase
      .rpc('sql', {
        query: 'VACUUM FULL admin_users, autorizados;'
      })

    if (vacuumError) {
      throw new Error(`VACUUM failed: ${vacuumError.message}`)
    }

    return new Response(
      JSON.stringify({
        message: 'Database vacuum completed successfully',
        note: 'Space has been reclaimed from migrated base64 data'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    throw new Error(`Vacuum operation failed: ${error.message}`)
  }
}

async function analyzeStorage(supabase: any) {
  console.log('Analyzing storage usage...')
  
  try {
    // Get table sizes
    const { data: tableSizes, error: sizeError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        `
      })

    if (sizeError) {
      throw new Error(`Storage analysis failed: ${sizeError.message}`)
    }

    // Count remaining base64 images
    const { data: base64Count, error: countError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            'admin_users' as table_name,
            COUNT(*) as base64_count
          FROM admin_users 
          WHERE foto_perfil_url LIKE 'data:image%'
          UNION ALL
          SELECT 
            'autorizados' as table_name,
            COUNT(*) as base64_count
          FROM autorizados 
          WHERE logo_url LIKE 'data:image%';
        `
      })

    if (countError) {
      throw new Error(`Base64 count failed: ${countError.message}`)
    }

    return new Response(
      JSON.stringify({
        message: 'Storage analysis completed',
        table_sizes: tableSizes,
        remaining_base64_images: base64Count
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    throw new Error(`Storage analysis failed: ${error.message}`)
  }
}