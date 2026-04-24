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

    const { table } = await req.json()

    if (table === 'admin_users') {
      return await migrateAdminUsers(supabase)
    } else if (table === 'autorizados') {
      return await migrateAutorizados(supabase)
    } else {
      throw new Error('Invalid table specified')
    }

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function migrateAdminUsers(supabase: any) {
  console.log('Starting admin_users migration...')
  
  // Get all users with base64 images
  const { data: users, error: fetchError } = await supabase
    .from('admin_users')
    .select('id, user_id, nome, foto_perfil_url')
    .not('foto_perfil_url', 'is', null)
    .like('foto_perfil_url', 'data:image/%')

  if (fetchError) {
    throw new Error(`Error fetching users: ${fetchError.message}`)
  }

  console.log(`Found ${users.length} users with base64 images`)

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const user of users) {
    try {
      // Convert base64 to blob
      const base64Data = user.foto_perfil_url.split(',')[1]
      const mimeType = user.foto_perfil_url.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*$/)?.[1] || 'image/jpeg'
      const extension = mimeType.split('/')[1]
      
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })

      // Upload to storage
      const fileName = `${user.user_id}-migrated.${extension}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, blob, { upsert: true })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath)

      // Update database
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ foto_perfil_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`)
      }

      results.successful++
      console.log(`Migrated user ${user.nome} (${user.id})`)

    } catch (error) {
      results.failed++
      results.errors.push(`User ${user.nome} (${user.id}): ${(error instanceof Error ? error.message : String(error))}`)
      console.error(`Failed to migrate user ${user.nome}:`, error)
    }
  }

  return new Response(
    JSON.stringify({
      message: 'Admin users migration completed',
      results
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function migrateAutorizados(supabase: any) {
  console.log('Starting autorizados migration...')
  
  // Get all autorizados with base64 images
  const { data: autorizados, error: fetchError } = await supabase
    .from('autorizados')
    .select('id, nome, logo_url')
    .not('logo_url', 'is', null)
    .like('logo_url', 'data:image/%')

  if (fetchError) {
    throw new Error(`Error fetching autorizados: ${fetchError.message}`)
  }

  console.log(`Found ${autorizados.length} autorizados with base64 images`)

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const autorizado of autorizados) {
    try {
      // Convert base64 to blob
      const base64Data = autorizado.logo_url.split(',')[1]
      const mimeType = autorizado.logo_url.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*$/)?.[1] || 'image/jpeg'
      const extension = mimeType.split('/')[1]
      
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })

      // Upload to storage
      const fileName = `${autorizado.id}-migrated.${extension}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('autorizados-logos')
        .upload(filePath, blob, { upsert: true })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('autorizados-logos')
        .getPublicUrl(filePath)

      // Update database
      const { error: updateError } = await supabase
        .from('autorizados')
        .update({ logo_url: publicUrl })
        .eq('id', autorizado.id)

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`)
      }

      results.successful++
      console.log(`Migrated autorizado ${autorizado.nome} (${autorizado.id})`)

    } catch (error) {
      results.failed++
      results.errors.push(`Autorizado ${autorizado.nome} (${autorizado.id}): ${(error instanceof Error ? error.message : String(error))}`)
      console.error(`Failed to migrate autorizado ${autorizado.nome}:`, error)
    }
  }

  return new Response(
    JSON.stringify({
      message: 'Autorizados migration completed',
      results
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}