import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'optimize_images' | 'cleanup_temp_files'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user and check if they are admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminData) {
      throw new Error('Access denied: Admin role required')
    }

    const body: RequestBody = await req.json()
    
    switch (body.action) {
      case 'optimize_images':
        return await optimizeImages(supabaseClient)
      case 'cleanup_temp_files':
        return await cleanupTempFiles(supabaseClient)
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function optimizeImages(supabaseClient: any) {
  try {
    // Set cache control for existing files in storage
    const { data: autorizadosFiles, error: authFilesError } = await supabaseClient.storage
      .from('autorizados-logos')
      .list('logos', { limit: 100 })

    if (authFilesError) throw authFilesError

    const results = {
      autorizados_optimized: 0,
      avatars_optimized: 0,
      errors: 0
    }

    // Update cache control for autorizados logos
    for (const file of autorizadosFiles || []) {
      try {
        await supabaseClient.storage
          .from('autorizados-logos')
          .update(`logos/${file.name}`, new Blob(), {
            cacheControl: '31536000', // 1 year
            upsert: false
          })
        results.autorizados_optimized++
      } catch (error) {
        console.error(`Error optimizing ${file.name}:`, error)
        results.errors++
      }
    }

    // Set cache control for user avatars
    const { data: avatarFiles, error: avatarFilesError } = await supabaseClient.storage
      .from('user-avatars')
      .list('avatars', { limit: 100 })

    if (avatarFilesError) throw avatarFilesError

    for (const file of avatarFiles || []) {
      try {
        await supabaseClient.storage
          .from('user-avatars')
          .update(`avatars/${file.name}`, new Blob(), {
            cacheControl: '31536000', // 1 year
            upsert: false
          })
        results.avatars_optimized++
      } catch (error) {
        console.error(`Error optimizing avatar ${file.name}:`, error)
        results.errors++
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Images optimized successfully',
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error optimizing images:', error)
    throw error
  }
}

async function cleanupTempFiles(supabaseClient: any) {
  try {
    const results = {
      temp_files_deleted: 0,
      errors: 0
    }

    // Clean up temp files in autorizados-logos bucket
    const { data: tempFiles, error: tempFilesError } = await supabaseClient.storage
      .from('autorizados-logos')
      .list('logos', { 
        limit: 100,
        search: 'temp-'
      })

    if (tempFilesError) throw tempFilesError

    for (const file of tempFiles || []) {
      if (file.name.startsWith('temp-')) {
        try {
          await supabaseClient.storage
            .from('autorizados-logos')
            .remove([`logos/${file.name}`])
          results.temp_files_deleted++
        } catch (error) {
          console.error(`Error deleting temp file ${file.name}:`, error)
          results.errors++
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Temp files cleaned up successfully',
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error cleaning up temp files:', error)
    throw error
  }
}