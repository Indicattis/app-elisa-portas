

## Plano: Botão de anexos (contratos) no header da downbar dos cards em /producao/instalacoes

### Objetivo
Adicionar um botão no header da `OrdemCarregamentoDetails` (sheet que abre ao clicar num card do calendário) que permite visualizar/baixar os contratos da venda vinculada ao pedido.

### Alterações

**1. `src/components/expedicao/OrdemCarregamentoDetails.tsx`**
- No header (linha ~65-89), adicionar um botão com ícone `Paperclip` ao lado dos badges
- Ao clicar, buscar contratos da `contratos_vendas` filtrando por `venda_id` da ordem
- Se houver 1 contrato: abrir diretamente em nova aba (`window.open`)
- Se houver múltiplos: exibir um dropdown/popover listando os contratos com nome e link para download
- Se não houver contratos: botão desabilitado ou com tooltip "Sem contratos"

**2. Busca dos contratos**
- Usar query inline com `supabase.from('contratos_vendas').select('id, arquivo_url, nome_arquivo').eq('venda_id', ordem.venda_id)` dentro do componente, via `useQuery` condicionado ao `open` do sheet
- Ou fazer uma query simples com `useEffect` quando o sheet abre

### Detalhes técnicos
- Importar `Paperclip` do lucide-react
- Usar `useQuery` com `enabled: open && !!ordem?.venda_id` para buscar contratos apenas quando o sheet estiver aberto
- Renderizar botão no header: se contratos > 0, botão ativo; senão, ghost/disabled
- Para múltiplos contratos, usar `DropdownMenu` existente no projeto

### Arquivo alterado
- `src/components/expedicao/OrdemCarregamentoDetails.tsx`

