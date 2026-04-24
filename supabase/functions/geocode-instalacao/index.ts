import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { corsHeaders } from '../_shared/cors.ts';

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { id, cidade, estado, table = 'instalacoes' } = await req.json() as GeocodeRequest & { table?: string };

    console.log(`Geocoding instalação: ${cidade}, ${estado}`);

    // Build search query
    const searchQuery = `${cidade}, ${estado}, Brazil`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;

    // Call Nominatim API
    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'ElisaPortas-App/1.0',
      },
    });

    const results: NominatimResponse[] = await nominatimResponse.json();

    if (results.length === 0) {
      console.error(`No geocoding results found for: ${searchQuery}`);
      return new Response(
        JSON.stringify({ error: 'Location not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = results[0];
    const latitude = parseFloat(location.lat);
    const longitude = parseFloat(location.lon);

    console.log(`Found coordinates: ${latitude}, ${longitude}`);

    // Update instalação or entrega with coordinates
    const { error: updateError } = await supabaseClient
      .from(table as any)
      .update({
        latitude,
        longitude,
        last_geocoded_at: new Date().toISOString(),
        geocode_precision: location.display_name,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating instalação:', updateError);
      throw updateError;
    }

    console.log(`Successfully geocoded instalação ${id}`);

    return new Response(
      JSON.stringify({
        success: true,
        latitude,
        longitude,
        display_name: location.display_name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in geocode-instalacao function:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
