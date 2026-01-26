

## Plano: Nova Pagina de Precos por Autorizado

### Visao Geral

Criar uma nova pagina `/logistica/autorizados` acessivel via o hub de Logistica que permitira gerenciar valores de instalacao de portas de enrolar por tamanho para cada parceiro autorizado.

### Tamanhos de Portas

| Tamanho | Descricao | Area |
|---------|-----------|------|
| P | Pequena | menor que 25m2 |
| G | Grande | entre 25m2 e 50m2 |
| GG | Extra Grande | maior que 50m2 |

---

### Parte 1: Banco de Dados

Criar uma nova tabela `autorizado_precos_portas` para armazenar os valores por autorizado e tamanho.

#### Nova Tabela: autorizado_precos_portas

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Chave primaria |
| autorizado_id | uuid | FK para autorizados |
| tamanho | text | P, G ou GG |
| valor | numeric | Valor em R$ |
| created_at | timestamp | Data de criacao |
| updated_at | timestamp | Data de atualizacao |
| created_by | uuid | Usuario que criou |

```sql
CREATE TABLE autorizado_precos_portas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autorizado_id uuid REFERENCES autorizados(id) ON DELETE CASCADE NOT NULL,
  tamanho text NOT NULL CHECK (tamanho IN ('P', 'G', 'GG')),
  valor numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(autorizado_id, tamanho)
);

ALTER TABLE autorizado_precos_portas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver precos"
  ON autorizado_precos_portas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem inserir precos"
  ON autorizado_precos_portas FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar precos"
  ON autorizado_precos_portas FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem deletar precos"
  ON autorizado_precos_portas FOR DELETE
  TO authenticated USING (true);
```

---

### Parte 2: Adicionar Botao no Hub de Logistica

Modificar `src/pages/logistica/LogisticaHub.tsx` para incluir novo item de menu.

#### Alteracao no menuItems (linha 9-15)

```typescript
const menuItems = [
  { label: "Controle", icon: ClipboardList, path: "/logistica/controle" },
  { label: "Calendario", icon: Truck, path: "/logistica/expedicao" },
  { label: "Frota", icon: Car, path: "/logistica/frota" },
  { label: "Instalacoes", icon: CalendarDays, path: "/logistica/instalacoes" },
  { label: "Frete", icon: Package, path: "/logistica/frete" },
  { label: "Autorizados", icon: Users, path: "/logistica/autorizados" }, // NOVO
];
```

Importar icone `Users` do lucide-react.

---

### Parte 3: Criar Nova Pagina

Criar arquivo `src/pages/logistica/AutorizadosPrecos.tsx` seguindo o padrao de `FreteMinimalista.tsx`.

#### Funcionalidades da Pagina

1. **Header** com botao voltar e titulo "Precos por Autorizado"
2. **Filtros** de busca por nome e estado
3. **Tabela** listando autorizados ativos com:
   - Nome do autorizado
   - Cidade/Estado
   - Valores P, G, GG (editaveis inline ou via modal)
4. **Modal de Edicao** para definir os 3 valores

#### Estrutura do Componente

```text
AutorizadosPrecos.tsx
├── Header (breadcrumb, titulo, botao voltar)
├── Filtros (busca, estado)
├── Tabela de Autorizados
│   ├── Nome
│   ├── Cidade/Estado
│   ├── Valor P (clicavel)
│   ├── Valor G (clicavel)
│   └── Valor GG (clicavel)
└── Dialog de Edicao de Precos
    ├── Nome do Autorizado (readonly)
    ├── Input Valor P (< 25m2)
    ├── Input Valor G (25-50m2)
    └── Input Valor GG (> 50m2)
```

---

### Parte 4: Criar Hook de Dados

Criar arquivo `src/hooks/useAutorizadosPrecos.ts` para gerenciar os dados.

#### Interface

```typescript
interface AutorizadoPreco {
  id: string;
  autorizado_id: string;
  tamanho: 'P' | 'G' | 'GG';
  valor: number;
}

interface AutorizadoComPrecos {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  precos: {
    P: number;
    G: number;
    GG: number;
  };
}
```

#### Funcoes

- `useAutorizadosComPrecos()` - Lista autorizados ativos com seus precos
- `upsertPrecos(autorizado_id, precos)` - Inserir/atualizar precos dos 3 tamanhos

---

### Parte 5: Criar Dialog de Edicao

Criar arquivo `src/components/autorizados/AutorizadoPrecosDialog.tsx`.

#### Layout do Dialog

```text
┌─────────────────────────────────────────┐
│  Definir Precos - [Nome Autorizado]     │
├─────────────────────────────────────────┤
│                                         │
│  Tamanho P (< 25m2)                     │
│  ┌─────────────────────────────────┐    │
│  │ R$ 0,00                         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Tamanho G (25m2 - 50m2)                │
│  ┌─────────────────────────────────┐    │
│  │ R$ 0,00                         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Tamanho GG (> 50m2)                    │
│  ┌─────────────────────────────────┐    │
│  │ R$ 0,00                         │    │
│  └─────────────────────────────────┘    │
│                                         │
│              [Cancelar] [Salvar]        │
└─────────────────────────────────────────┘
```

---

### Parte 6: Registrar Rota no App.tsx

Adicionar nova rota no arquivo `src/App.tsx`.

```typescript
// Importar componente
import AutorizadosPrecos from "@/pages/logistica/AutorizadosPrecos";

// Adicionar rota (linha ~398)
<Route path="/logistica/autorizados" element={
  <ProtectedRoute routeKey="logistica_hub">
    <AutorizadosPrecos />
  </ProtectedRoute>
} />
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Criar tabela `autorizado_precos_portas` |
| `src/pages/logistica/LogisticaHub.tsx` | Adicionar botao "Autorizados" |
| `src/pages/logistica/AutorizadosPrecos.tsx` | Criar nova pagina |
| `src/hooks/useAutorizadosPrecos.ts` | Criar hook de dados |
| `src/components/autorizados/AutorizadoPrecosDialog.tsx` | Criar dialog de edicao |
| `src/App.tsx` | Registrar nova rota |

---

### Resultado Esperado

1. No hub `/logistica` aparecera um novo botao "Autorizados"
2. Ao clicar, o usuario vai para `/logistica/autorizados`
3. Lista todos os autorizados ativos com seus valores de portas
4. Ao clicar em um autorizado, abre modal para definir valores P, G e GG
5. Os valores sao salvos no banco e exibidos na tabela

