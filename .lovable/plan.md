

## Plano: Adicionar informações da visita técnica na downbar do Carregamento

### Contexto
A downbar (`CarregamentoDownbar.tsx`) já exibe um link para a ficha de visita no header, mas faltam os contratos/anexos da venda. O componente `OrdemCarregamentoDetails.tsx` (usado na expedição) já implementa esse padrão com busca de `contratos_vendas` e exibição via Paperclip/DropdownMenu.

### Alterações

**Arquivo: `src/components/carregamento/CarregamentoDownbar.tsx`**

1. Adicionar query para buscar contratos da venda (`contratos_vendas`) usando `useQuery`, igual ao padrão do `OrdemCarregamentoDetails.tsx`
2. No header, ao lado do link da ficha de visita, adicionar botão de Paperclip para contratos:
   - Se 1 contrato: botão direto que abre o arquivo
   - Se múltiplos: DropdownMenu listando todos
   - Se nenhum: botão desabilitado
3. Importar componentes necessários: `DropdownMenu`, `Tooltip`, `useQuery`, `supabase`

### Resultado
O header da downbar terá: link da ficha de visita técnica (já existente) + botão de contratos/anexos (novo), seguindo o mesmo padrão visual da tela de expedição.

