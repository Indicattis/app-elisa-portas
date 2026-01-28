
## Plano: Adicionar Remocao de Responsavel em Ordens Pausadas/Pendentes

### Contexto

O usuario quer poder remover o responsavel de uma ordem quando ela estiver pausada ou pendente. Esse padrao ja existe no componente `OrdensAccordion.tsx` (usado em `/administrativo/pedidos`), e precisa ser adicionado na pagina `/fabrica/ordens-pedidos`.

### Arquitetura Atual

A pagina `/fabrica/ordens-pedidos` usa:
- `PedidoOrdemCard.tsx`: Exibe cards compactos de pedidos com badges de status das ordens
- `OrdemLinhasSheet.tsx`: Drawer lateral que mostra linhas da ordem ao clicar em um badge

O hook `useOrdensPorPedido.ts` ja retorna `responsavel` e `status` de cada ordem.

### Implementacao

#### 1. Adicionar Botao de Remover Responsavel no OrdemLinhasSheet

**Arquivo:** `src/components/fabrica/OrdemLinhasSheet.tsx`

Adicionar um botao "Remover Responsavel" que aparece apenas quando:
- A ordem tem um `responsavel_id`
- O status e `pendente` ou a ordem esta `pausada`

```tsx
// Adicionar imports
import { UserMinus } from "lucide-react";
import { RemoverResponsavelModal } from "@/components/pedidos/RemoverResponsavelModal";

// Adicionar estado e mutation
const [showRemoverModal, setShowRemoverModal] = useState(false);
const [isRemovingResponsavel, setIsRemovingResponsavel] = useState(false);

// Verificar se pode remover (pausada ou pendente)
const podeRemoverResponsavel = ordem?.responsavel && 
  (ordem?.pausada || ordem?.status === 'pendente');

// Adicionar funcao de remocao
const handleRemoverResponsavel = async () => {
  // Determinar tabela pelo tipo
  // Atualizar responsavel_id = null
  // Atualizar capturada_em = null
  // Invalidar queries
};

// Adicionar botao na area de acoes
{podeRemoverResponsavel && (
  <Button onClick={() => setShowRemoverModal(true)}>
    <UserMinus />
    Remover Responsavel
  </Button>
)}

// Adicionar modal de confirmacao
<RemoverResponsavelModal
  open={showRemoverModal}
  onOpenChange={setShowRemoverModal}
  onConfirm={handleRemoverResponsavel}
  responsavelNome={ordem?.responsavel?.nome}
  responsavelFoto={ordem?.responsavel?.foto_url}
  nomeSetor={TIPO_LABELS[ordem?.tipo]}
  isLoading={isRemovingResponsavel}
/>
```

#### 2. Atualizar Hook useOrdensPorPedido (se necessario)

O hook ja retorna `responsavel` com `nome` e `foto_url`, mas precisa retornar tambem o `responsavel_id` para a remocao:

**Arquivo:** `src/hooks/useOrdensPorPedido.ts`

Adicionar `responsavel_id` ao `OrdemStatus`:

```typescript
export interface OrdemStatus {
  // ... existentes
  responsavel_id: string | null; // ADICIONAR
}

// Na funcao criarOrdemStatus:
return {
  // ... existentes
  responsavel_id: ordem?.responsavel_id || null,
};
```

#### 3. Modal de Confirmacao

Reutilizar o componente existente `RemoverResponsavelModal.tsx` que ja esta implementado com:
- Avatar do responsavel
- Nome do setor
- Mensagem explicativa
- Botoes Cancelar/Remover

### Logica de Remocao

A remocao segue o padrao do `OrdensAccordion.tsx`:

```typescript
const tableMap: Record<string, string> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
  qualidade: 'ordens_qualidade',
  pintura: 'ordens_pintura',
};

const updateData = {
  responsavel_id: null,
  capturada_em: null,
};

await supabase
  .from(tableName)
  .update(updateData)
  .eq('id', ordem.id);
```

### Fluxo do Usuario

1. Usuario abre a pagina `/fabrica/ordens-pedidos`
2. Expande um card de pedido
3. Clica em uma ordem pausada ou pendente que tem responsavel
4. O drawer abre mostrando as linhas da ordem
5. Botao "Remover Responsavel" aparece (cor laranja)
6. Usuario clica no botao
7. Modal de confirmacao aparece mostrando avatar e nome do responsavel
8. Usuario confirma
9. Responsavel e removido, ordem fica disponivel para captura

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useOrdensPorPedido.ts` | Adicionar `responsavel_id` ao retorno |
| `src/components/fabrica/OrdemLinhasSheet.tsx` | Adicionar botao e logica de remocao com modal |

### Visualizacao do Botao

```text
+------------------------------------------+
|  [Package] Separacao #OSE-2026-0026      |
|             [Avatar: Artur]              |
+------------------------------------------+
|  Responsavel: Artur Diesel               |
|  Progresso: 2/5 linhas concluidas (40%)  |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | [!] ORDEM PAUSADA                  |  |
|  |     Linha com problema: Motor 800  |  |
|  |     Motivo: Falta de motor 800AC   |  |
|  +------------------------------------+  |
|                                          |
|  [Regenerar linhas]  [Remover Responsavel]|
|                      ^^^^^^^^^^^^^^^^^   |
|                      (cor laranja)       |
+------------------------------------------+
```

### Restricoes de Exibicao

O botao so aparece quando:
- `ordem.responsavel !== null` (tem responsavel)
- `ordem.pausada === true` OU `ordem.status === 'pendente'`

NAO aparece quando:
- `ordem.status === 'em_andamento'` (ordem ativa)
- `ordem.status === 'concluido'` (ordem finalizada)
