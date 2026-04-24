import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
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

    console.log('Starting batch geocoding of autorizados...');

    // Buscar autorizados ativos que não têm coordenadas ou foram geocodificados há mais de 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: autorizados, error: fetchError } = await supabaseClient
      .from('autorizados')
      .select('id, nome, cidade, estado, latitude, longitude, last_geocoded_at')
      .eq('ativo', true)
      .not('cidade', 'is', null)
      .not('estado', 'is', null)
      .or(`latitude.is.null,longitude.is.null,last_geocoded_at.is.null,last_geocoded_at.lt.${thirtyDaysAgo.toISOString()}`)
      .limit(50); // Limitar para evitar timeout

    if (fetchError) {
      throw new Error(`Error fetching autorizados: ${fetchError.message}`);
    }

    if (!autorizados || autorizados.length === 0) {
      console.log('No autorizados need geocoding');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No autorizados need geocoding',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${autorizados.length} autorizados to geocode`);

    let successCount = 0;
    let errorCount = 0;

    for (const autorizado of autorizados) {
      try {
        console.log(`Geocoding autorizado ${autorizado.id}: ${autorizado.cidade}, ${autorizado.estado}`);

        // Build the search query
        const addressParts = [autorizado.cidade, autorizado.estado, 'Brasil'].filter(Boolean);
        const searchQuery = encodeURIComponent(addressParts.join(', '));
        
        // Call Nominatim API (OpenStreetMap's geocoding service)
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1&countrycodes=br&addressdetails=1`;
        
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
          console.log(`No results found for autorizado ${autorizado.id}`);
          errorCount++;
          continue;
        }

        const result = results[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        console.log(`Found coordinates for ${autorizado.id}: ${latitude}, ${longitude}`);

        // Update the autorizado with coordinates
        const { error: updateError } = await supabaseClient
          .from('autorizados')
          .update({
            latitude,
            longitude,
            last_geocoded_at: new Date().toISOString(),
            geocode_precision: result.importance ? 'high' : 'medium'
          })
          .eq('id', autorizado.id);

        if (updateError) {
          console.error(`Error updating autorizado ${autorizado.id}:`, updateError);
          errorCount++;
          continue;
        }

        successCount++;
        console.log(`Successfully geocoded autorizado ${autorizado.id}`);

        // Add a small delay to respect rate limits (1 request per second)
        await new Promise(resolve => setTimeout(resolve, 1100));

      } catch (error) {
        console.error(`Error geocoding autorizado ${autorizado.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Batch geocoding completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: autorizados.length,
        successCount,
        errorCount,
        message: `Batch geocoding completed. ${successCount} successful, ${errorCount} errors`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Batch geocoding error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error instanceof Error ? error.message : String(error)) || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});