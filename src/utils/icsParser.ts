export interface ParsedICSEvent {
  uid: string;
  summary: string;
  dtstart: string;
  location: string | null;
  description: string | null;
  // Campos extraídos
  nomeCliente: string;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  corPorta: string | null;
  telefone: string | null;
  observacoes: string | null;
  dataInstalacao: string;
}

export interface ICSParseResult {
  events: ParsedICSEvent[];
  errors: string[];
}

/**
 * Extrai o nome do cliente do SUMMARY
 * Exemplo: "Andreia Lucia - Porta de Enrolar (Preto Semi Brilho)" -> "Andreia Lucia"
 */
function extractClientName(summary: string): string {
  const parts = summary.split(' - ');
  return parts[0]?.trim() || summary.trim();
}

/**
 * Extrai a cor da porta do SUMMARY entre parênteses
 * Exemplo: "Andreia Lucia - Porta de Enrolar (Preto Semi Brilho)" -> "Preto Semi Brilho"
 */
function extractDoorColor(summary: string): string | null {
  const match = summary.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : null;
}

/**
 * Extrai cidade e estado do LOCATION
 * Exemplo: "Caxias do Sul/RS - R. Antonieta..." -> { cidade: "Caxias do Sul", estado: "RS" }
 */
function extractCityState(location: string | null): { cidade: string | null; estado: string | null } {
  if (!location) return { cidade: null, estado: null };
  
  // Padrão: "Cidade/UF - Endereço" ou "Cidade/UF"
  const match = location.match(/^([^/]+)\/([A-Z]{2})/i);
  if (match) {
    return {
      cidade: match[1].trim(),
      estado: match[2].toUpperCase()
    };
  }
  
  return { cidade: null, estado: null };
}

/**
 * Extrai o endereço do LOCATION (parte após cidade/estado)
 */
function extractAddress(location: string | null): string | null {
  if (!location) return null;
  
  // Remove cidade/estado do início
  const match = location.match(/^[^/]+\/[A-Z]{2}\s*-\s*(.+)$/i);
  if (match) {
    return match[1].trim();
  }
  
  // Se não encontrar o padrão, retorna o location inteiro
  return location;
}

/**
 * Extrai telefone do DESCRIPTION
 * Procura por padrões como (XX) XXXXX-XXXX ou similares
 */
function extractPhone(description: string | null): string | null {
  if (!description) return null;
  
  // Padrões comuns de telefone brasileiro
  const patterns = [
    /\(?\d{2}\)?\s*\d{4,5}[-.\s]?\d{4}/g,
    /\d{2}\s*\d{4,5}[-.\s]?\d{4}/g
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return null;
}

/**
 * Constrói observações a partir do DESCRIPTION
 */
function buildObservations(description: string | null): string | null {
  if (!description) return null;
  
  // Limpa caracteres especiais do ICS
  let clean = description
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .trim();
  
  return clean || null;
}

/**
 * Converte data do formato ICS (YYYYMMDD ou YYYYMMDDTHHMMSS) para YYYY-MM-DD
 */
function parseICSDate(dtstart: string): string {
  // Remove qualquer timezone info
  const dateStr = dtstart.replace(/[TZ]/g, '').substring(0, 8);
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}-${month}-${day}`;
}

/**
 * Parser principal do arquivo ICS
 */
export function parseICSFile(content: string): ICSParseResult {
  const events: ParsedICSEvent[] = [];
  const errors: string[] = [];
  
  try {
    // Dividir em blocos de eventos
    const eventBlocks = content.split('BEGIN:VEVENT');
    
    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i];
      const endIndex = block.indexOf('END:VEVENT');
      if (endIndex === -1) continue;
      
      const eventContent = block.substring(0, endIndex);
      
      try {
        const event = parseEventBlock(eventContent);
        if (event) {
          events.push(event);
        }
      } catch (err) {
        errors.push(`Erro ao processar evento ${i}: ${err}`);
      }
    }
  } catch (err) {
    errors.push(`Erro ao processar arquivo: ${err}`);
  }
  
  return { events, errors };
}

/**
 * Processa um bloco individual de evento
 */
function parseEventBlock(content: string): ParsedICSEvent | null {
  const lines = content.split(/\r?\n/);
  const props: Record<string, string> = {};
  
  let currentKey = '';
  let currentValue = '';
  
  for (const line of lines) {
    // Linhas de continuação começam com espaço ou tab
    if (line.startsWith(' ') || line.startsWith('\t')) {
      currentValue += line.substring(1);
      continue;
    }
    
    // Salvar propriedade anterior
    if (currentKey) {
      props[currentKey] = currentValue;
    }
    
    // Nova propriedade
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      // Pode ter parâmetros antes do valor (ex: DTSTART;VALUE=DATE:20251026)
      const keyPart = line.substring(0, colonIndex);
      const baseName = keyPart.split(';')[0];
      currentKey = baseName;
      currentValue = line.substring(colonIndex + 1);
    }
  }
  
  // Salvar última propriedade
  if (currentKey) {
    props[currentKey] = currentValue;
  }
  
  // Validar campos obrigatórios
  const uid = props['UID'] || `generated-${Date.now()}-${Math.random()}`;
  const summary = props['SUMMARY'];
  const dtstart = props['DTSTART'];
  
  if (!summary || !dtstart) {
    return null;
  }
  
  const location = props['LOCATION'] || null;
  const description = props['DESCRIPTION'] || null;
  
  const { cidade, estado } = extractCityState(location);
  
  return {
    uid,
    summary,
    dtstart,
    location,
    description,
    nomeCliente: extractClientName(summary),
    cidade,
    estado,
    endereco: extractAddress(location),
    corPorta: extractDoorColor(summary),
    telefone: extractPhone(description),
    observacoes: buildObservations(description),
    dataInstalacao: parseICSDate(dtstart)
  };
}
