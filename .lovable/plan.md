

# Adicionar botões "Despesas" e "Custos" em /direcao/dre

## O que será feito

Adicionar dois botões de navegação abaixo do grid de meses na página `/direcao/dre` (`DREDirecao.tsx`):

1. **Despesas** → navega para `/direcao/dre/despesas` — página nova que é uma versão simplificada de `CustosGridMinimalista.tsx`, contendo **somente** a seção de Tipos de Custos (tabela + CRUD + gerenciador de categorias), sem o grid de meses e sem os summary cards.

2. **Custos** → navega para `/direcao/dre/custos` — página nova que lista os itens do estoque com foco em configuração de `custo_unitario`, permitindo editar o custo de cada item.

## Alterações

### 1. `src/pages/direcao/DREDirecao.tsx`
Adicionar dois botões após o grid de meses (após linha 101), no estilo minimalista existente:
```tsx
<div className="flex gap-4 mt-6">
  <button onClick={() => navigate('/direcao/dre/despesas')} className="...">Despesas</button>
  <button onClick={() => navigate('/direcao/dre/custos')} className="...">Custos</button>
</div>
```

### 2. Nova página: `src/pages/direcao/DREDespesasDirecao.tsx`
- Clone da seção de Tipos de Custos de `CustosGridMinimalista.tsx` (linhas 240-562)
- Usa `MinimalistLayout` com breadcrumb `Home > Direção > DRE > Despesas`
- Back path: `/direcao/dre`
- Inclui: tabela de tipos de custos com filtros, CRUD completo, gerenciador de categorias/subcategorias
- **Não inclui**: grid de meses, summary cards

### 3. Nova página: `src/pages/direcao/DRECustosDirecao.tsx`
- Lista itens do estoque (tabela `estoque`, ativo=true) com colunas: Nome, Categoria, Unidade, Custo Unitário
- Permite edição inline do `custo_unitario` (click para editar, Enter/blur para salvar)
- Busca com filtro por nome
- Usa `MinimalistLayout` com breadcrumb `Home > Direção > DRE > Custos`
- Back path: `/direcao/dre`

### 4. `src/App.tsx`
Registrar as duas novas rotas:
- `/direcao/dre/despesas` → `DREDespesasDirecao`
- `/direcao/dre/custos` → `DRECustosDirecao`

## Arquivos alterados/criados
- `src/pages/direcao/DREDirecao.tsx` (editado)
- `src/pages/direcao/DREDespesasDirecao.tsx` (novo)
- `src/pages/direcao/DRECustosDirecao.tsx` (novo)
- `src/App.tsx` (editado)

