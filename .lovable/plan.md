

# Plano: Detalhes da Venda em /direcao/faturamento/venda/:id

## Visao Geral

Criar uma nova pagina de detalhes de venda acessivel via clique nas linhas da tabela de faturamento da direcao, exibindo informacoes completas sobre custos, descontos/acrescimos e lucros.

---

## Estrutura da Solucao

### 1. Criar Nova Pagina `FaturamentoVendaDirecao.tsx`

Nova pagina em `src/pages/direcao/FaturamentoVendaDirecao.tsx` baseada no estilo do `FaturamentoVendaMinimalista.tsx`, mas adaptada para o contexto da direcao.

#### Conteudo da Pagina:

**Header:**
- Breadcrumb: Home > Direcao > Faturamento > Cliente
- Botao Voltar para `/direcao/faturamento`
- Badge indicando se a venda esta "Faturada" ou nao

**Cards de Resumo (grid 4 colunas):**
- Valor Total (valor_venda + valor_credito)
- Lucro Bruto (soma lucro_item dos produtos + lucro_instalacao)
- Margem de Lucro (% sobre valor total)
- Progresso do Faturamento (X/Y itens faturados)

**Secao de Descontos e Acrescimos:**
- Card com 2 colunas mostrando:
  - Total de Descontos (vermelho) com detalhes da autorizacao
  - Total de Acrescimos/Credito (verde)
- Tooltip ou info sobre quem autorizou o desconto

**Tabela de Produtos da Venda:**
- Tipo do Produto
- Descricao
- Quantidade
- Valor Unitario
- Desconto aplicado
- Custo de Producao
- Lucro do Item
- Status (Faturado/Pendente)

**Linha Virtual de Instalacao:**
- Se houver valor de instalacao, exibir como linha separada com:
  - Valor da instalacao
  - Lucro (30% automatico)
  - Status do faturamento

**Secao de Valores:**
- Valor dos Produtos
- Valor da Instalacao
- Valor do Frete
- Descontos Totais
- Acrescimos (credito)
- **Valor Final da Venda**

**Secao Informacoes do Cliente:**
- Nome do cliente
- Cidade/Estado
- Data da venda
- Data prevista de entrega
- Tipo de expedicao (Entrega/Instalacao)

**Secao Vendedor:**
- Avatar e nome do atendente responsavel

---

### 2. Registrar Rota no App.tsx

Adicionar nova rota protegida:

```typescript
import FaturamentoVendaDirecao from "./pages/direcao/FaturamentoVendaDirecao";

// Na area de rotas da direcao:
<Route 
  path="/direcao/faturamento/venda/:id" 
  element={
    <ProtectedRoute routeKey="direcao_hub">
      <FaturamentoVendaDirecao />
    </ProtectedRoute>
  } 
/>
```

---

### 3. Atualizar FaturamentoDirecao.tsx

Corrigir a navegacao ao clicar na linha da tabela:

**Antes (linha 869):**
```typescript
onClick={() => navigate(`/dashboard/vendas/${venda.id}`)}
```

**Depois:**
```typescript
onClick={() => navigate(`/direcao/faturamento/venda/${venda.id}`)}
```

---

## Estrutura do Componente

```typescript
// FaturamentoVendaDirecao.tsx

interface VendaDetalhes {
  id: string;
  cliente_nome: string;
  cidade: string | null;
  estado: string | null;
  data_venda: string;
  data_prevista_entrega: string | null;
  tipo_entrega: string | null;
  valor_venda: number;
  valor_credito: number;
  valor_frete: number;
  valor_instalacao: number;
  lucro_instalacao: number | null;
  instalacao_faturada: boolean;
  frete_aprovado: boolean;
  atendente_id: string;
}

interface ProdutoVenda {
  id: string;
  tipo_produto: string;
  descricao: string;
  quantidade: number;
  valor_produto: number;
  valor_pintura: number;
  valor_total: number;
  desconto_valor: number;
  custo_producao: number;
  custo_produto: number;
  custo_pintura: number;
  lucro_item: number;
  faturamento: boolean;
}

interface AutorizacaoDesconto {
  id: string;
  percentual_desconto: number;
  tipo_autorizacao: string;
  autorizador: {
    nome: string;
    foto_perfil_url: string | null;
  };
}
```

---

## Query Supabase

```typescript
const { data } = await supabase
  .from("vendas")
  .select(`
    *,
    produtos_vendas(
      id,
      tipo_produto,
      descricao,
      quantidade,
      valor_produto,
      valor_pintura,
      valor_total,
      desconto_valor,
      custo_producao,
      custo_produto,
      custo_pintura,
      lucro_item,
      faturamento,
      catalogo_cores(nome, codigo_hex)
    ),
    autorizacao_desconto:vendas_autorizacoes_desconto(
      id,
      percentual_desconto,
      tipo_autorizacao,
      autorizado_por,
      autorizador:admin_users!vendas_autorizacoes_desconto_autorizado_por_fkey(
        nome,
        foto_perfil_url
      )
    )
  `)
  .eq("id", id)
  .single();

// Buscar atendente separadamente
const { data: atendenteData } = await supabase
  .from("admin_users")
  .select("user_id, nome, foto_perfil_url")
  .eq("user_id", vendaData.atendente_id)
  .single();
```

---

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/direcao/FaturamentoVendaDirecao.tsx` | **Criar** - Nova pagina de detalhes |
| `src/App.tsx` | **Editar** - Adicionar import e rota |
| `src/pages/direcao/FaturamentoDirecao.tsx` | **Editar** - Corrigir navigate da linha da tabela |

---

## Layout Visual (Resumo)

```text
+------------------------------------------------------------------+
| Breadcrumb: Home > Direção > Faturamento > Cliente               |
+------------------------------------------------------------------+
| [<] Voltar    DETALHES DA VENDA       [Badge: Faturada/Pendente] |
|                Cliente: Nome do Cliente                           |
+------------------------------------------------------------------+
| +-------------+ +-------------+ +-------------+ +-------------+  |
| | VALOR TOTAL | | LUCRO BRUTO | | MARGEM      | | PROGRESSO   |  |
| | R$ X.XXX,XX | | R$ X.XXX,XX | | XX.XX%      | | X/Y itens   |  |
| +-------------+ +-------------+ +-------------+ +-------------+  |
+------------------------------------------------------------------+
| DESCONTOS E ACRESCIMOS                                           |
| +-------------------------+ +---------------------------+        |
| | DESCONTOS    -R$XXX,XX  | | ACRESCIMOS     +R$XXX,XX |        |
| | XX% - Senha Master      | | Credito do cliente       |        |
| | Autorizado: João Silva  | |                          |        |
| +-------------------------+ +---------------------------+        |
+------------------------------------------------------------------+
| PRODUTOS DA VENDA                                                |
| +--------------------------------------------------------------+ |
| | Tipo | Desc | Qtd | Valor | Desc | Custo | Lucro | Status   | |
| +--------------------------------------------------------------+ |
| | Porta Enrolar | ... | 1 | R$X | -R$X | R$X | R$X | Faturado | |
| | Pintura Epoxi | ... | 1 | R$X | -R$X | R$X | R$X | Faturado | |
| | *Instalacao*  | ... | 1 | R$X | -    | R$X | R$X | Faturado | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
| RESUMO FINANCEIRO                    | INFORMACOES              |
| Produtos: R$ X.XXX,XX                | Cliente: Nome            |
| Instalacao: R$ X.XXX,XX              | Cidade: Cidade/UF        |
| Frete: R$ X.XXX,XX                   | Data Venda: DD/MM/YYYY   |
| Descontos: -R$ XXX,XX                | Previsao: DD/MM/YYYY     |
| Acrescimos: +R$ XXX,XX               | Tipo: Instalacao         |
| TOTAL: R$ X.XXX,XX                   | Vendedor: [Avatar] Nome  |
+------------------------------------------------------------------+
```

---

## Detalhes Tecnicos

### Estilizacao

A pagina seguira o padrao dark/glassmorphism do sistema:
- Fundo preto (`bg-black`)
- Cards com `bg-white/5 border-white/10`
- Textos em branco com opacidade variavel
- Cores de destaque:
  - Verde (`emerald-400`) para lucro e acrescimos
  - Vermelho (`red-400`) para descontos
  - Azul (`blue-400`) para margem
  - Amarelo (`amber-400`) para alertas

### Componentes Reutilizados

- `MinimalistLayout` ou `AnimatedBreadcrumb` + `FloatingProfileMenu`
- `Card`, `CardHeader`, `CardContent` do shadcn
- `Table`, `TableRow`, `TableCell` do shadcn
- `Badge` para status
- `Avatar` para vendedor
- `Button` para navegacao

