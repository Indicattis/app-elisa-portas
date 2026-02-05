
# Plano: Hub de Aprovacoes e Pagina Aprovacoes Fabrica

## Objetivo
Criar um novo hub de aprovacoes em `/direcao/aprovacoes` com uma pagina dedicada para aprovacao de pedidos na etapa "Aprovacao CEO", otimizada para dispositivos moveis.

## Estrutura de Navegacao

```text
/direcao (DirecaoHub)
├── Vendas
├── Faturamento
├── Gestao de Fabrica
├── Gestao de Instalacoes
├── Estoque
├── Metas
├── Autorizados
└── [NOVO] Aprovacoes  --> /direcao/aprovacoes
                              └── Aprovacoes Fabrica --> /direcao/aprovacoes/fabrica
```

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/direcao/aprovacoes/DirecaoAprovacoesHub.tsx` | Hub de aprovacoes com mesmo estilo do DirecaoEstoqueHub |
| `src/pages/direcao/aprovacoes/AprovacoesProducao.tsx` | Pagina mobile-first para aprovar pedidos |
| `src/hooks/usePedidosAprovacaoCEO.ts` | Hook para buscar e aprovar pedidos na etapa aprovacao_ceo |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/direcao/DirecaoHub.tsx` | Adicionar botao "Aprovacoes" com icone ShieldCheck |
| `src/App.tsx` | Adicionar rotas /direcao/aprovacoes e /direcao/aprovacoes/fabrica |

---

## Detalhes Tecnicos

### 1. DirecaoHub.tsx - Novo Botao

Adicionar ao array menuItems:

```typescript
import { ShieldCheck } from 'lucide-react';

const menuItems = [
  // ... itens existentes
  { label: 'Aprovacoes', icon: ShieldCheck, path: '/direcao/aprovacoes' },
];
```

### 2. Hook usePedidosAprovacaoCEO.ts

```typescript
interface PedidoAprovacao {
  id: string;
  numero_pedido: string;
  cliente_nome: string;
  valor_venda: number | null;
  data_entrega: string | null;
  created_at: string;
  produtos_resumo: string; // Ex: "2 Portas, 1 Motor"
}

// Query: pedidos_producao WHERE etapa_atual = 'aprovacao_ceo' AND arquivado = false
// Join com vendas para obter dados do cliente e produtos
// Ordenacao: created_at ASC (mais antigos primeiro - FIFO)

// Funcao aprovarPedido:
// 1. Buscar pedidos_etapas atual
// 2. Marcar checkboxes como checked
// 3. Chamar funcao de avancar etapa
```

### 3. AprovacoesProducao.tsx - Layout Mobile-First

```text
+------------------------------------------+
| [<]  Aprovacoes Fabrica       [Atualizar] |
+------------------------------------------+
| 10 pedidos aguardando aprovacao          |
+------------------------------------------+
|                                          |
| +--------------------------------------+ |
| | PED-0190                        [>]  | |
| | Helio Joao Barbosa                   | |
| | Criado: 04/02/2026                   | |
| | 2 Portas de Enrolar                  | |
| |                                      | |
| | [ ] Pedido revisado pela diretoria   | |
| | [ ] Aprovado para producao           | |
| |                                      | |
| | [APROVAR E ENVIAR PARA PRODUCAO]     | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | PED-0188 ...                         | |
| +--------------------------------------+ |
+------------------------------------------+
```

Caracteristicas Mobile-First:
- Cards em tela cheia com scroll vertical
- Checkboxes grandes para toque facil (min-h-12)
- Botao de aprovacao proeminente (h-14, full width)
- Pull-to-refresh para atualizar lista
- Feedback haptico ao aprovar (se disponivel)
- Navegacao para detalhes do pedido ao clicar no header

### 4. DirecaoAprovacoesHub.tsx

Hub identico ao DirecaoEstoqueHub com:
- Icone principal: ShieldCheck (laranja)
- Titulo: "Aprovacoes"
- Subtitulo: "Aprove pedidos e solicitacoes"
- Breadcrumb: Home > Direcao > Aprovacoes
- Botao inicial: "Aprovacoes Fabrica" (icone Factory)

### 5. Rotas no App.tsx

```typescript
// Hub de Aprovacoes da Direcao
<Route path="/direcao/aprovacoes" element={<ProtectedRoute routeKey="direcao_hub"><DirecaoAprovacoesHub /></ProtectedRoute>} />
<Route path="/direcao/aprovacoes/fabrica" element={<ProtectedRoute routeKey="direcao_hub"><AprovacoesProducao /></ProtectedRoute>} />
```

---

## Fluxo de Aprovacao

1. Diretor acessa /direcao/aprovacoes/fabrica
2. Ve lista de pedidos na etapa "Aprovacao CEO" ordenados por data de criacao
3. Para cada pedido, ve resumo (numero, cliente, produtos)
4. Marca os 2 checkboxes obrigatorios:
   - "Pedido revisado pela diretoria"
   - "Aprovado para producao"
5. Clica em "Aprovar e Enviar para Producao"
6. Sistema avanca pedido para etapa "em_producao"
7. Ordens de producao sao criadas automaticamente (soldagem, perfiladeira, etc)

## Dados Atuais

Existem 10+ pedidos aguardando aprovacao CEO no sistema, como:
- PED-0190: Helio Joao Barbosa
- PED-0188: HOPP PORTOES LTDA
- PED-0186: Claudio Montezana dos Santos
- E outros...

## Migracao SQL

Nenhuma alteracao de banco necessaria - utilizara estrutura existente de pedidos_producao, pedidos_etapas e hook usePedidosEtapas para avancar etapas.
