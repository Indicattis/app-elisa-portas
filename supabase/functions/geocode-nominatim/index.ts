import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

interface GeocodeRequest {
  id: string;
  cidade: string;
  estado: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { id, cidade, estado }: GeocodeRequest = await req.json();
    
    console.log(`Geocoding autorizado ${id}: ${cidade}, ${estado}`);

    // Build the search query
    const addressParts = [cidade, estado, 'Brasil'].filter(Boolean);
    const searchQuery = encodeURIComponent(addressParts.join(', '));
    
    // Call Nominatim API (OpenStreetMap's geocoding service)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1&countrycodes=br&addressdetails=1`;
    
    console.log(`Calling Nominatim: ${nominatimUrl}`);
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'ElisaPortas-MapApp/1.0 (contact@elisaportas.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const results: NominatimResponse[] = await response.json();
    
    if (results.length === 0) {
      console.log(`No results found for autorizado ${id}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Endereço não encontrado' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    const result = results[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    console.log(`Found coordinates for ${id}: ${latitude}, ${longitude}`);

    // Update the autorizado with coordinates
    const { error: updateError } = await supabaseClient
      .from('autorizados')
      .update({
        latitude,
        longitude,
        last_geocoded_at: new Date().toISOString(),
        geocode_precision: result.importance ? 'high' : 'medium'
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating autorizado:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log(`Successfully geocoded autorizado ${id}`);

    return new Response(
      JSON.stringify({
        success: true,
        latitude,
        longitude,
        address: result.display_name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error instanceof Error ? error.message : String(error)) || 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});