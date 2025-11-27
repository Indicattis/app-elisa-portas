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
    
    if (isPortaEnrolar) {
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
        <div key={cor.nome} className="flex items-center gap-1.5">
          <div
            className="h-4 w-4 rounded-full border-2 border-border shadow-sm"
            style={{ backgroundColor: cor.codigo_hex }}
            title={cor.nome}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {cor.nome}
          </span>
        </div>
      ))}
    </div>
  );
}
