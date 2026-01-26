
## Plano: Mover Precos para Direcao e Criar Acordos em Logistica

### Visao Geral

O usuario solicitou duas alteracoes principais:

1. **Mover** a funcionalidade de precos de autorizados de `/logistica/autorizados` para `/direcao/autorizados`
2. **Criar** nova funcionalidade em `/logistica/autorizados` para cadastrar acordos de instalacao com autorizados

---

### Parte 1: Mover Precos para Direcao

#### 1.1 Criar novo arquivo em Direcao

Criar `src/pages/direcao/AutorizadosPrecosDirecao.tsx` copiando o conteudo de `AutorizadosPrecos.tsx` com ajustes:

- Alterar breadcrumb de "Logistica" para "Direcao"
- Alterar botao voltar para `/direcao`
- Ajustar titulo se necessario

#### 1.2 Atualizar Hub de Direcao

Modificar `src/pages/direcao/DirecaoHub.tsx`:

```typescript
import { Users } from 'lucide-react';

const menuItems = [
  { label: 'Vendas', icon: ShoppingCart, path: '/direcao/vendas' },
  { label: 'Faturamento', icon: DollarSign, path: '/direcao/faturamento' },
  { label: 'Gestao de Fabrica', icon: Factory, path: '/direcao/gestao-fabrica' },
  { label: 'Gestao de Instalacoes', icon: Truck, path: '/direcao/gestao-instalacao' },
  { label: 'Metas', icon: Target, path: '/direcao/metas' },
  { label: 'Autorizados', icon: Users, path: '/direcao/autorizados' }, // NOVO
];
```

#### 1.3 Atualizar App.tsx

- Adicionar nova rota `/direcao/autorizados`
- Remover rota antiga `/logistica/autorizados` (sera substituida pela nova funcionalidade)

---

### Parte 2: Criar Sistema de Acordos em Logistica

#### 2.1 Nova Tabela: acordos_instalacao_autorizados

Criar migration para nova tabela que armazenara os acordos:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| autorizado_id | uuid | FK para autorizados |
| cliente_nome | text | Nome do cliente |
| cliente_cidade | text | Cidade do cliente |
| cliente_estado | text | Estado do cliente |
| quantidade_portas | integer | Total de portas |
| valor_acordado | numeric | Valor acordado com autorizado |
| status | text | pendente, em_andamento, concluido |
| data_acordo | date | Data do acordo |
| observacoes | text | Observacoes opcionais |
| created_at | timestamptz | Data criacao |
| created_by | uuid | Usuario que criou |

#### 2.2 Nova Tabela: acordo_portas

Tabela para armazenar detalhes de cada porta do acordo:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| acordo_id | uuid | FK para acordos_instalacao_autorizados |
| tamanho | text | P, G ou GG |
| valor_unitario | numeric | Valor por porta (baseado no preco cadastrado) |

#### 2.3 Nova Pagina: AcordosAutorizados.tsx

Criar `src/pages/logistica/AcordosAutorizados.tsx` com:

**Funcionalidades:**
- Listagem de acordos existentes
- Filtro por status, autorizado, periodo
- Botao para criar novo acordo

**Tabela exibira:**
- Cliente (nome, cidade-estado)
- Autorizado
- Qtd Portas (resumo: 2P, 1G, 1GG)
- Valor Acordado
- Status
- Data

#### 2.4 Dialog de Cadastro de Acordo

Criar `src/components/autorizados/NovoAcordoDialog.tsx`:

```text
┌─────────────────────────────────────────────────────────────┐
│  Novo Acordo de Instalacao                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLIENTE                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Nome do Cliente                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌───────────────────┐  ┌─────────────────────────────┐    │
│  │ Cidade            │  │ Estado [UF v]               │    │
│  └───────────────────┘  └─────────────────────────────┘    │
│                                                             │
│  AUTORIZADO                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Selecione o autorizado... [v]                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  PORTAS                                                     │
│  ┌──────────────┬────────────────────────┬────────────┐    │
│  │ Porta 1      │ Tamanho: [P v]         │ [Remover]  │    │
│  ├──────────────┼────────────────────────┼────────────┤    │
│  │ Porta 2      │ Tamanho: [G v]         │ [Remover]  │    │
│  └──────────────┴────────────────────────┴────────────┘    │
│  [+ Adicionar Porta]                                        │
│                                                             │
│  VALOR ACORDADO                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ R$ 0,00                                             │    │
│  └─────────────────────────────────────────────────────┘    │
│  Valor sugerido: R$ X (baseado nos precos cadastrados)      │
│                                                             │
│                         [Cancelar] [Salvar Acordo]          │
└─────────────────────────────────────────────────────────────┘
```

#### 2.5 Hook para Acordos

Criar `src/hooks/useAcordosAutorizados.ts`:

```typescript
interface AcordoAutorizado {
  id: string;
  autorizado_id: string;
  autorizado_nome: string;
  cliente_nome: string;
  cliente_cidade: string;
  cliente_estado: string;
  quantidade_portas: number;
  valor_acordado: number;
  status: 'pendente' | 'em_andamento' | 'concluido';
  data_acordo: string;
  portas: { tamanho: 'P' | 'G' | 'GG'; valor_unitario: number }[];
}

// Funcoes:
// - fetchAcordos() - listar acordos com filtros
// - createAcordo() - criar novo acordo com portas
// - updateAcordo() - atualizar acordo existente
// - deleteAcordo() - remover acordo
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Criar tabelas `acordos_instalacao_autorizados` e `acordo_portas` |
| `src/pages/direcao/DirecaoHub.tsx` | Adicionar botao "Autorizados" |
| `src/pages/direcao/AutorizadosPrecosDirecao.tsx` | Criar (copiar de logistica com ajustes) |
| `src/pages/logistica/AcordosAutorizados.tsx` | Criar nova pagina de acordos |
| `src/pages/logistica/AutorizadosPrecos.tsx` | Remover (sera substituido) |
| `src/components/autorizados/NovoAcordoDialog.tsx` | Criar dialog de cadastro |
| `src/hooks/useAcordosAutorizados.ts` | Criar hook para gerenciar acordos |
| `src/pages/logistica/LogisticaHub.tsx` | Alterar label de "Autorizados" para "Acordos com Autorizados" ou manter |
| `src/App.tsx` | Atualizar rotas: adicionar `/direcao/autorizados`, alterar `/logistica/autorizados` |

---

### SQL para Novas Tabelas

```sql
-- Tabela de acordos
CREATE TABLE acordos_instalacao_autorizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizado_id uuid REFERENCES autorizados(id) ON DELETE CASCADE NOT NULL,
  cliente_nome text NOT NULL,
  cliente_cidade text NOT NULL,
  cliente_estado text NOT NULL,
  quantidade_portas integer NOT NULL DEFAULT 1,
  valor_acordado numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  data_acordo date NOT NULL DEFAULT CURRENT_DATE,
  observacoes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Tabela de portas do acordo
CREATE TABLE acordo_portas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id uuid REFERENCES acordos_instalacao_autorizados(id) ON DELETE CASCADE NOT NULL,
  tamanho text NOT NULL CHECK (tamanho IN ('P', 'G', 'GG')),
  valor_unitario numeric(10,2) NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE acordos_instalacao_autorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE acordo_portas ENABLE ROW LEVEL SECURITY;

-- Policies para usuarios autenticados
CREATE POLICY "Usuarios autenticados podem ver acordos"
  ON acordos_instalacao_autorizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem inserir acordos"
  ON acordos_instalacao_autorizados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados podem atualizar acordos"
  ON acordos_instalacao_autorizados FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem deletar acordos"
  ON acordos_instalacao_autorizados FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem ver portas"
  ON acordo_portas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem inserir portas"
  ON acordo_portas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados podem atualizar portas"
  ON acordo_portas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem deletar portas"
  ON acordo_portas FOR DELETE TO authenticated USING (true);
```

---

### Resultado Esperado

1. **Em `/direcao`**: Novo botao "Autorizados" leva para `/direcao/autorizados` com gestao de precos P, G, GG
2. **Em `/logistica/autorizados`**: Nova interface para cadastrar acordos de instalacao:
   - Selecionar cliente (nome, cidade, estado)
   - Selecionar autorizado instalador
   - Adicionar portas com tamanhos (P, G, GG)
   - Definir valor acordado
   - Acompanhar status dos acordos

