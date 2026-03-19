
## Plano: corrigir “Tamanho Total” zerado em `/administrativo/producao`

### Diagnóstico rápido
O cálculo atual só funciona quando:
- `largura` e `altura` numéricas existem, ou
- `tamanho` está no formato `L x A`.

Nos dados reais, muitos itens vêm com `tamanho` como número simples (`"6,00"`, `"4.82"`), então a regex `LxA` não encontra nada e o total fica 0.

### O que vou implementar

1. **Atualizar a fonte de tamanho no hook**
   - Arquivo: `src/hooks/useItensNaoConcluidosPorEtapa.ts`
   - Incluir na query de `linhas_ordens` também o relacionamento com `pedido_linhas` via `pedido_linha_id`, trazendo:
     - `tamanho`
     - `largura`
     - `altura`
   - Mapear esses campos para o objeto retornado, como fallback explícito do “tamanho cadastrado no pedido”.

2. **Fortalecer o cálculo no agrupamento**
   - Arquivo: `src/pages/administrativo/ProducaoAdminReadOnly.tsx`
   - No `useMemo` de `itensAgrupadosPorEtapa`, calcular `valorTamanho` com prioridade:
     1. `largura * altura` (da linha da ordem)
     2. parse `L x A` de `tamanho` (linha da ordem)
     3. parse numérico simples de `tamanho` (linha da ordem, ex: `6,00`)
     4. repetir 2 e 3 usando o `tamanho` vindo de `pedido_linhas` (fallback pedido)
   - Somar `valorTamanho * quantidade` em `tamanhoTotal`.

3. **Manter UI e estrutura**
   - Não alterar layout, colunas, nem fluxo da tela.
   - Apenas corrigir a lógica para a coluna “Tamanho Total” deixar de mostrar “-” quando houver tamanho preenchido no pedido.

### Detalhes técnicos
- Normalização de número: `replace(',', '.')` antes de `parseFloat`.
- Regex para `LxA`: `(\d+[.,]?\d*)\s*[xX]\s*(\d+[.,]?\d*)`.
- Fallback do pedido será usado só quando a linha da ordem não fornecer tamanho útil.

### Arquivos impactados
- `src/hooks/useItensNaoConcluidosPorEtapa.ts`
- `src/pages/administrativo/ProducaoAdminReadOnly.tsx`
