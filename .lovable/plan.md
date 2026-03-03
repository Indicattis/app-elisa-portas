

# Reestruturação das seções de despesas em /direcao/dre/:mes

## Layout final (de cima para baixo)

```text
┌──────────────────────────────────────────────────────────────┐
│  Faturamento / Lucro (tabela existente - sem alteração)      │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐  ┌──────────────────────────┐
│  1. Despesas Fixas              │  │  Despesas Projetadas     │
│     (modalidade='fixa')         │  │  do Ano                  │
│     [como já está]              │  │                          │
├─────────────────────────────────┤  │  Lista de tipos_custos   │
│  2. Folha Salarial              │  │  variáveis com           │
│     (seção nova, read-only)     │  │  valor_maximo_mensal×12  │
├─────────────────────────────────┤  │                          │
│  3. Despesas Projetadas         │  │  Total anual no rodapé   │
│     (nova modalidade            │  │                          │
│      'projetada' ou reutiliza   │  │                          │
│      'variavel' com CRUD)       │  │                          │
├─────────────────────────────────┤  │                          │
│  4. Despesas Variáveis          │  │                          │
│     Não Esperadas               │  │                          │
│     (nova modalidade            │  │                          │
│      'variavel_nao_esperada')   │  │                          │
└─────────────────────────────────┘  └──────────────────────────┘
```

## Detalhamento

### 1. Banco de dados
- Adicionar duas novas modalidades à tabela `despesas_mensais`: `'projetada'` e `'variavel_nao_esperada'`
- A modalidade `'variavel'` existente será migrada: os registros atuais passarão a ser `'projetada'` (pois são despesas variáveis esperadas)
- Nenhuma tabela nova é necessária. A `folha_salarial` não existe ainda — buscaremos os dados de `tipos_custos` onde `tipo = 'fixa'` com nome relacionado a salários, ou criaremos uma seção estática alimentada por um campo específico

**Pergunta importante**: De onde vem o valor da folha salarial? Opções:
- Uma despesa fixa específica já cadastrada em `despesas_mensais`
- Um novo campo/registro dedicado

Como não há tabela de folha salarial, a seção **Folha Salarial** será alimentada por despesas com `modalidade = 'folha_salarial'` na tabela `despesas_mensais` — permitindo cadastrar múltiplos itens (salários, encargos, benefícios, etc.) com o mesmo componente `DespesaSection`.

### 2. Alterações em `DREMesDirecao.tsx`

**Estados novos**:
- `despesasProjetadas` (modalidade `'projetada'`)
- `despesasFolha` (modalidade `'folha_salarial'`)
- `despesasNaoEsperadas` (modalidade `'variavel_nao_esperada'`)
- `tiposCustosVariaveis` (para o painel lateral)

**fetchDespesas** — separar em 4 grupos ao filtrar por modalidade:
- `fixa` → Despesas Fixas
- `folha_salarial` → Folha Salarial
- `projetada` → Despesas Projetadas
- `variavel_nao_esperada` → Despesas Variáveis Não Esperadas

**Nova query** para painel lateral — buscar `tipos_custos` onde `tipo = 'variavel'`:
```sql
SELECT nome, valor_maximo_mensal FROM tipos_custos WHERE tipo = 'variavel'
```
Exibir cada item com `valor_maximo_mensal * 12` e um total no rodapé.

**Layout do JSX**:
- Grid de 2 colunas: coluna esquerda com as 4 seções empilhadas, coluna direita com o painel "Despesas Projetadas do Ano"
- Reutilizar o componente `DespesaSection` para todas as 4 seções, apenas alterando título e modalidade
- O painel lateral será um componente estático (sem CRUD), apenas listagem

### 3. Migração de dados existentes
- Atualizar registros existentes com `modalidade = 'variavel'` para `modalidade = 'projetada'` via query SQL, pois as despesas variáveis atuais representam despesas esperadas/projetadas

