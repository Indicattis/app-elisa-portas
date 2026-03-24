

## Plano: Melhorar cards dos leads com tempo, captura e WhatsApp

### Alterações em `src/components/vendas/LeadKanbanCard.tsx`

1. **Flag de tempo desde cadastro** — calcular a diferença entre `now()` e `data_envio`, exibir como badge colorido no topo do card:
   - Verde: < 3 dias
   - Amarelo: 3-7 dias
   - Vermelho: > 7 dias
   - Formato: "2h", "3d", "1sem" (usando lógica similar ao `formatarTempo` do `useCronometroChamado`)

2. **Botão "Capturar"** — visível apenas quando `atendente_id` é `null` (lead sem atendente):
   - Ícone `UserCheck` com texto "Capturar"
   - Ao clicar, atualiza `atendente_id` para o `user.id` logado no Supabase
   - Precisa receber `onCapture` callback e `userId` como props

3. **Botão WhatsApp** — sempre visível:
   - Ícone `MessageCircle` (verde)
   - Usa a função `handleWhatsAppClick` de `src/utils/timeUtils.ts`
   - `e.stopPropagation()` para não ativar o drag

4. **Layout do card** — reorganizar:
   - Header: nome + badge de tempo
   - Info: telefone, cidade, data, atendente
   - Valor do orçamento
   - Footer: botões de ação (Capturar / WhatsApp) lado a lado

### Alterações em `src/pages/vendas/LeadsList.tsx`

- Passar `userId` e callback `onCapture` para os componentes
- Função `handleCapture(leadId)`: atualiza `atendente_id` no Supabase + estado local otimista

### Alterações em `src/components/vendas/LeadKanbanColumn.tsx`

- Propagar as novas props (`userId`, `onCapture`) para os cards

### Arquivos alterados
1. `src/components/vendas/LeadKanbanCard.tsx`
2. `src/components/vendas/LeadKanbanColumn.tsx`
3. `src/pages/vendas/LeadsList.tsx`

