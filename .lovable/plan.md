
# Plano: Sistema de Arquivo Morto para Pedidos Finalizados

## Contexto da Anomalia (Pedido 0081)
O pedido foi finalizado em 02/02/2026 mas reapareceu indevidamente em producao em 05/02/2026 e foi avancado para qualidade. A solucao correta seria mante-lo em Finalizado e permitir arquivamento para evitar acoes acidentais.

## Objetivo
Implementar um sistema de "Arquivo Morto" que:
1. Permite arquivar pedidos finalizados (acao consciente do usuario)
2. Cria uma pagina dedicada em `/fabrica/arquivo-morto` para visualizar pedidos arquivados
3. Pedidos arquivados ficam protegidos contra movimentacoes acidentais

## Estrutura Proposta

```text
/fabrica (FabricaHub)
├── Gestao de Pedidos
├── Ordens por Pedido
├── Cronograma Producao
├── Controle de Estoque
├── Producao
└── [NOVO] Arquivo Morto  <-- Nova entrada
```

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/fabrica/ArquivoMorto.tsx` | CRIAR | Pagina de visualizacao de pedidos arquivados |
| `src/hooks/usePedidosArquivados.ts` | CRIAR | Hook para buscar pedidos arquivados |
| `src/pages/fabrica/FabricaHub.tsx` | MODIFICAR | Adicionar item de menu para Arquivo Morto |
| `src/App.tsx` | MODIFICAR | Adicionar rota /fabrica/arquivo-morto |

---

## Detalhes Tecnicos

### 1. Hook `usePedidosArquivados.ts`

```typescript
interface PedidoArquivado {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  data_arquivamento: string;
  arquivado_por: string;
  arquivado_por_nome?: string;
  etapa_atual: string; // sempre 'finalizado'
  data_entrega: string | null;
  tipo_entrega: string | null;
  // dados da venda
  valor_venda: number | null;
}

// Query: buscar de pedidos_producao WHERE arquivado = true
// Ordenacao: data_arquivamento DESC (mais recentes primeiro)
// Join com profiles para obter nome de quem arquivou
```

### 2. Pagina `ArquivoMorto.tsx`

Layout similar ao PedidosProducaoMinimalista mas simplificado:

```text
+--------------------------------------------------+
| [<] Arquivo Morto             [Busca] [Exportar] |
+--------------------------------------------------+
|                                                  |
| Total: 45 pedidos arquivados                     |
|                                                  |
| +----------------------------------------------+ |
| | PED-0045 | Cliente ABC | 02/02/2026          | |
| | Arquivado por: Marcos                        | |
| +----------------------------------------------+ |
| | PED-0044 | Cliente XYZ | 01/02/2026          | |
| | Arquivado por: Ana                           | |
| +----------------------------------------------+ |
|                                                  |
| [Paginacao]                                      |
+--------------------------------------------------+
```

Funcionalidades:
- Busca por numero do pedido ou nome do cliente
- Filtro por periodo de arquivamento
- Visualizacao detalhada ao clicar (apenas leitura)
- Exportar lista em Excel (opcional)

### 3. Card de Pedido Arquivado

Componente simplificado mostrando:
- Numero do pedido
- Nome do cliente
- Data de arquivamento
- Quem arquivou
- Valor total da venda (se disponivel)
- Badge "Arquivado" verde

### 4. Atualizacao do FabricaHub

Adicionar novo item ao menu:

```typescript
const menuItems = [
  { label: 'Gestao de Pedidos', icon: Package, path: '/fabrica/pedidos-producao' },
  { label: 'Ordens por Pedido', icon: ClipboardList, path: '/fabrica/ordens-pedidos' },
  { label: 'Cronograma Producao', icon: Calendar, path: '/fabrica/cronograma-producao' },
  { label: 'Controle de Estoque', icon: Boxes, path: '/fabrica/controle-estoque' },
  { label: 'Producao', icon: Factory, path: '/fabrica/producao' },
  // NOVO
  { label: 'Arquivo Morto', icon: Archive, path: '/fabrica/arquivo-morto' },
];

const routeKeyMap: Record<string, string> = {
  // ... rotas existentes
  '/fabrica/arquivo-morto': 'fabrica_arquivo_morto',
};
```

### 5. Rota no App.tsx

```typescript
import ArquivoMorto from "./pages/fabrica/ArquivoMorto";

// Na secao de rotas da fabrica:
<Route 
  path="/fabrica/arquivo-morto" 
  element={
    <ProtectedRoute routeKey="fabrica_arquivo_morto">
      <ArquivoMorto />
    </ProtectedRoute>
  } 
/>
```

---

## Fluxo de Uso

1. Usuario finaliza o fluxo do pedido (chega em "Finalizado")
2. Na etapa Finalizado, aparece botao "Arquivar"
3. Usuario confirma arquivamento no modal existente (ArquivarPedidoModal)
4. Pedido e movido para o Arquivo Morto
5. Pedido desaparece das listagens de producao
6. Pode ser consultado em /fabrica/arquivo-morto

## Consideracoes sobre Permissoes

- A rota `fabrica_arquivo_morto` deve ser adicionada a tabela `app_routes` para controle de acesso
- Usuarios com permissao podem visualizar o arquivo
- Desarquivar (se necessario no futuro) seria uma funcao administrativa

## Correcao do Pedido 0081

Apos implementacao, o pedido 0081 deve ser manualmente corrigido:
1. Atualizar `etapa_atual` para 'finalizado'
2. Deletar a ordem de qualidade duplicada (OQU-2026-0092)
3. Arquivar o pedido para prevenir futuras anomalias
