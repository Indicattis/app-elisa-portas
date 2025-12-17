interface CoresPortasEnrolarProps {
  produtos?: Array<{
    tipo_produto?: string;
    catalogo_cores?: { nome: string; codigo_hex: string } | null;
    cor?: { nome: string; codigo_hex: string } | null;
  }>;
}

export function CoresPortasEnrolar({ produtos = [] }: CoresPortasEnrolarProps) {
  // Filtrar portas de enrolar e extrair cores únicas
  const coresUnicas = new Map<string, { nome: string; codigo_hex: string }>();
  
  produtos.forEach((produto) => {
    const isPortaEnrolar = produto.tipo_produto === 'porta_enrolar' || produto.tipo_produto === 'porta';
    const isPintura = produto.tipo_produto === 'pintura_epoxi';
    
    if (isPortaEnrolar || isPintura) {
      const cor = produto.catalogo_cores || produto.cor;
      if (cor && cor.nome && cor.codigo_hex) {
        coresUnicas.set(cor.nome, cor);
      }
    }
  });

  // Se não houver cores, não renderizar nada
  if (coresUnicas.size === 0) {
    return null;
  }

  const coresArray = Array.from(coresUnicas.values());

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {coresArray.map((cor) => (
        <div key={cor.nome} className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-full border-2 border-border shadow-sm"
            style={{ backgroundColor: cor.codigo_hex }}
            title={cor.nome}
          />
          <span className="text-sm font-medium text-foreground">
            {cor.nome}
          </span>
        </div>
      ))}
    </div>
  );
}
