

# Adicionar Porta Social na secao de Medidas

## Alteracao

Modificar `src/components/pedidos/MedidasPortasSection.tsx` para incluir portas sociais junto com as portas de enrolar:

1. **Remover filtro** na linha 78 - em vez de `.filter(p => p.tipo_produto === 'porta_enrolar')`, manter todas as portas (enrolar + social)
2. **Atualizar titulo** de "Medidas das Portas de Enrolar" para "Medidas das Portas"
3. **Inicializar medidas** para todas as portas (o estado inicial ja itera sobre `portas`, entao basta mudar o filtro)
4. **Condicao de exibicao** na linha 92 - ja funcionara automaticamente pois `portas` incluira ambos os tipos
5. **SVG diferenciado** (opcional) - usar cor diferente para porta social vs enrolar para diferenciar visualmente (ex: roxo para social, azul para enrolar)

### Detalhes tecnicos

```typescript
// Linha 76-78: remover filtro
const portas = todasExpandidas
  .map((p, idx) => ({ ...p, _globalIndex: idx }));
// sem .filter - mostra todas

// Linha 135: titulo generico
"Medidas das Portas"

// Cards: cor condicional baseada em tipo_produto
const isPortaSocial = porta.tipo_produto === 'porta_social';
// Usar cor diferente no SVG/borda para diferenciar
```

O label ja vem correto via `getLabelProdutoExpandido` (mostra "Porta Social #2" ou "Porta de Enrolar #1"), entao a identificacao visual ja esta resolvida.

