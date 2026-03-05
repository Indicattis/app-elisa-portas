

# Auto-calcular lucro de Portas de Enrolar via Tabela de Preços

## O que será feito

Travar o lucro das portas de enrolar no faturamento, calculando automaticamente com base na tabela de preços (`tabela_precos_portas`), da mesma forma que já funciona para pintura (auto-cálculo) e instalação (30% fixo, sem botão de edição).

## Alterações em `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

### 1. Adicionar useEffect de auto-faturamento para porta_enrolar
Após o useEffect existente de `pintura_epoxi` (linha ~299), adicionar um novo useEffect que:
- Filtra produtos `porta_enrolar` sem lucro preenchido e ainda não processados
- Extrai dimensões de `largura`/`altura` (com fallback para parsing do `tamanho`)
- Busca na `tabela_precos_portas` a menor entrada onde `largura >= (porta - 0.15)` e `altura >= (porta - 0.15)`, ordenando por largura e altura crescente
- Define `lucro_item = tabela.lucro * quantidade` e `custo_producao = valor_total - lucro_item`
- Usa o mesmo padrão de `autoFaturadosRef` para evitar loops

### 2. Travar botão de edição para porta_enrolar
Na coluna "Ações" da tabela (linha ~754), quando `tipo_produto === 'porta_enrolar'`, exibir um ícone de check (como na instalação) ao invés do botão de editar, indicando que o lucro é automático.

### 3. Indicador visual na coluna Lucro
Quando o lucro de uma porta de enrolar estiver preenchido, mostrar o badge com "(Tabela)" ao lado do valor, similar ao "(30%)" da instalação, para deixar claro que veio da tabela de preços.

## Arquivo afetado
- `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

