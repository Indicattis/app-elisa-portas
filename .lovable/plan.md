
## Plano: Redesign da Listagem de Ordens de Instalacao

### Objetivo

Redesenhar a pagina `/logistica/instalacoes/ordens-instalacoes` com:
1. Separacao em duas listagens: **Carregadas** vs **Nao Carregadas**
2. Novo design compacto com linhas de **35px**
3. Foto de perfil de quem carregou
4. Badges **P, G, GG** para tamanho das portas
5. Valor da venda
6. Listagem dedicada para **Neo Instalacoes** e **Neo Correcoes** com mesmo design

---

### Estrutura da Nova Pagina

```text
┌─────────────────────────────────────────────────────────────┐
│ Header + Filtros (existentes)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ SECAO 1: NAO CARREGADAS ─────────────────────────────┐  │
│ │ [Titulo] Aguardando Carregamento (X)                   │  │
│ │ ┌──────────────────────────────────────────────────┐  │  │
│ │ │ Linha 35px: Avatar│Cliente│Cidade│P/G│Valor│Acao│  │  │
│ │ │ Linha 35px: ...                                   │  │
│ │ └──────────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ SECAO 2: CARREGADAS ────────────────────────────────┐   │
│ │ [Titulo] Prontas para Instalacao (X)                  │   │
│ │ ┌──────────────────────────────────────────────────┐  │  │
│ │ │ Linha 35px: FotoCarregou│Cliente│Data│P/G│Valor │  │  │
│ │ └──────────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ SECAO 3: NEO INSTALACOES ──────────────────────────┐    │
│ │ [Titulo] Instalacoes Avulsas (X)                     │    │
│ │ ┌──────────────────────────────────────────────────┐  │  │
│ │ │ Linha 35px: Avatar│Cliente│Cidade│Data│Equipe   │  │  │
│ │ └──────────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ SECAO 4: NEO CORRECOES ────────────────────────────┐    │
│ │ [Titulo] Correcoes Avulsas (X)                       │    │
│ │ ┌──────────────────────────────────────────────────┐  │  │
│ │ │ Linha 35px: Avatar│Cliente│Cidade│Data│Equipe   │  │  │
│ │ └──────────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Design da Linha (35px)

Cada linha tera altura fixa de 35px com as informacoes em formato tabular horizontal:

```text
| Avatar | #Pedido | Cliente        | Cidade/UF | P/G/GG | Valor    | Status  | Acao |
| 24px   | 60px    | flex-1         | 80px      | 80px   | 80px     | 70px    | 50px |
```

**Colunas para Ordens de Instalacao:**
1. Avatar de quem carregou (ou placeholder se nao carregada)
2. Numero do pedido
3. Nome do cliente (truncado)
4. Cidade/Estado
5. Badges P, G, GG (cores: P=Cyan, G=Purple, GG=Orange)
6. Valor da venda formatado
7. Status (Carregada/Aguardando + data)
8. Botao Concluir

**Colunas para Neo Instalacoes/Correcoes:**
1. Avatar do criador
2. AVULSO badge
3. Nome do cliente
4. Cidade/Estado
5. Data agendada
6. Equipe responsavel
7. Botao Concluir

---

### Regras de Tamanho P/G/GG

Baseado na area da porta (largura x altura em metros):
- **P (Pequena)**: area <= 25m² - Badge Cyan
- **G (Grande)**: area > 25m² e <= 50m² - Badge Purple  
- **GG (Extra Grande)**: area > 50m² - Badge Orange

---

### Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| src/pages/logistica/OrdensInstalacoesLogistica.tsx | Modificar | Reestruturar layout com 4 secoes |
| src/hooks/useOrdensInstalacao.ts | Modificar | Adicionar dados de carregamento e valor |
| src/components/instalacoes/OrdemInstalacaoRow.tsx | Criar | Componente de linha 35px para ordens |
| src/components/instalacoes/NeoInstalacaoRow.tsx | Criar | Componente de linha 35px para Neo Instalacoes |
| src/components/instalacoes/NeoCorrecaoRow.tsx | Criar | Componente de linha 35px para Neo Correcoes |

---

### Mudanca 1: Hook useOrdensInstalacao.ts

Adicionar campos ao select:
- `carregamento_concluido`
- `carregamento_concluido_por`
- `data_carregamento`
- `valor_venda` (da tabela vendas)

Buscar foto de perfil de quem carregou via `admin_users`:

```typescript
// Apos buscar ordens, buscar fotos dos usuarios que carregaram
const carregadoPorIds = [...new Set(
  ordensFiltered
    .filter(o => o.carregamento_concluido_por)
    .map(o => o.carregamento_concluido_por)
)];

const { data: usuarios } = await supabase
  .from('admin_users')
  .select('user_id, nome, foto_perfil_url')
  .in('user_id', carregadoPorIds);
```

---

### Mudanca 2: Componente OrdemInstalacaoRow.tsx

```typescript
interface OrdemInstalacaoRowProps {
  ordem: OrdemInstalacao;
  onConcluir: (id: string) => void;
  isConcluindo: boolean;
}

// Calcular badges de tamanho
const calcularBadgesPorta = (produtos: Produto[]) => {
  const contagem = { P: 0, G: 0, GG: 0 };
  produtos.filter(p => p.tipo_produto === 'porta_enrolar').forEach(p => {
    const area = (p.largura || 0) * (p.altura || 0);
    if (area > 50) contagem.GG++;
    else if (area > 25) contagem.G++;
    else contagem.P++;
  });
  return contagem;
};

// Render: linha h-[35px] com grid layout
```

Cores dos badges:
- P: `bg-cyan-500/20 text-cyan-600 border-cyan-500/50`
- G: `bg-purple-500/20 text-purple-600 border-purple-500/50`
- GG: `bg-orange-500/20 text-orange-600 border-orange-500/50`

---

### Mudanca 3: Pagina OrdensInstalacoesLogistica.tsx

Separar ordens em duas listas:

```typescript
const { ordensNaoCarregadas, ordensCarregadas } = useMemo(() => {
  return {
    ordensNaoCarregadas: ordensFiltradas.filter(o => !o.carregamento_concluido),
    ordensCarregadas: ordensFiltradas.filter(o => o.carregamento_concluido)
  };
}, [ordensFiltradas]);
```

Renderizar 4 secoes:
1. Aguardando Carregamento (ordensNaoCarregadas)
2. Prontas para Instalacao (ordensCarregadas)
3. Instalacoes Avulsas (neoInstalacoes)
4. Correcoes Avulsas (neoCorrecoes)

---

### Mudanca 4: Componentes NeoInstalacaoRow e NeoCorrecaoRow

Design identico ao OrdemInstalacaoRow mas com campos especificos:
- Avatar do criador
- Badge "AVULSO" (azul para instalacao, roxo para correcao)
- Cidade/Estado
- Data de agendamento
- Equipe responsavel
- Botao concluir

---

### Resumo Visual

**Antes:**
- Cards grandes ocupando muito espaco
- Sem separacao por status de carregamento
- Neo Instalacoes/Correcoes em grid de cards

**Depois:**
- Linhas compactas de 35px
- Secao separada para carregadas vs nao carregadas
- Foto de quem carregou visivel
- Badges P/G/GG coloridos
- Valor da venda visivel
- Neo Instalacoes/Correcoes no mesmo formato de linhas

---

### Detalhes Tecnicos

1. **Grid template para linha:**
```css
grid-template-columns: 28px 60px 1fr 80px 90px 70px 90px 50px
```

2. **Cores dos badges de tamanho:**
- P (<=25m²): Cyan `#06b6d4`
- G (25-50m²): Purple `#8b5cf6`
- GG (>50m²): Orange `#f97316`

3. **Formato do valor:**
```typescript
const formatarValor = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};
// Ex: R$ 27.000
```

4. **Avatar de quem carregou:**
- Se `carregamento_concluido`: mostra foto do usuario
- Se nao carregado: mostra icone de truck outline em cinza

