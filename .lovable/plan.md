

## Plano: Adicionar coluna CAC por canal na tabela LTV

### O que será feito

Adicionar uma coluna **"CAC"** na tabela de LTV que mostra o Custo de Aquisição do Cliente, calculado com base no **canal de aquisição** do cliente e no **mês de cadastro** (created_at).

### Lógica de cálculo

```text
CAC do cliente = Investimento do canal no mês de cadastro ÷ Nº de clientes adquiridos por esse canal no mesmo mês
```

**Mapeamento canal → coluna de investimento:**
- Google → `investimento_google_ads`
- Meta (Facebook/Instagram) → `investimento_meta_ads`
- LinkedIn → `investimento_linkedin_ads`
- TikTok / Outros → `outros_investimentos`
- Indicação, Cliente fidelizado, Autorizado → sem investimento (CAC = "—")

Os investimentos são somados entre todas as regiões para o mês.

### Alterações no arquivo `LtvMinimalista.tsx`

1. **Interface `ClienteLtv`**: adicionar campos `canalAquisicaoId`, `canalAquisicaoNome`, `mesAquisicao` (YYYY-MM) e `cac: number | null`

2. **Query (`queryFn`)**: buscar também `canal_aquisicao_id` e `created_at` dos clientes, a tabela `canais_aquisicao` e `marketing_investimentos`. Calcular para cada cliente:
   - Identificar o mês de cadastro (YYYY-MM de `created_at`)
   - Mapear o canal para a coluna de investimento correspondente
   - Somar investimentos daquele canal naquele mês (todas as regiões)
   - Contar quantos clientes ativos têm o mesmo canal e mesmo mês de cadastro
   - CAC = investimento total do canal no mês ÷ nº de clientes desse canal no mês

3. **SortKey**: adicionar `'cac'` como opção de ordenação

4. **Tabela**: adicionar coluna "CAC" entre "Última Compra" e "Ticket Médio", com `hidden md:table-cell`, mostrando `fmt(cac)` ou "—" quando não aplicável

5. **Colspan**: ajustar de 6 para 7

Nenhuma alteração de banco de dados necessária — todos os dados já existem.

