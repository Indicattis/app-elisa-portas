

## Plano: Adicionar data de cadastro nos leads

### Alteração

**`src/pages/vendas/LeadsList.tsx`**

1. Importar `Calendar` de `lucide-react`
2. Na seção de info de cada lead (linha ~196-205), adicionar a `data_envio` formatada ao lado do telefone e cidade:
   - Formato: `dd/mm/aaaa` usando `new Date(lead.data_envio).toLocaleDateString('pt-BR')`
   - Ícone `Calendar` com mesmo estilo dos outros (`w-3.5 h-3.5`)

Nenhuma alteração de dados necessária — o campo `data_envio` já é buscado na query.

