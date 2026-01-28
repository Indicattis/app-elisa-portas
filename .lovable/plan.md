

## Plano: Adicionar Botão e Página de Regras de Vendas

### Objetivo
Criar um botão na página `/direcao/vendas` que encaminha para uma nova página `/direcao/vendas/regras-vendas`, onde serão exibidas todas as regras do sistema de vendas de forma organizada e visual.

---

### Alterações Necessárias

#### 1. Adicionar Botão na Página VendasDirecao

**Arquivo:** `src/pages/direcao/VendasDirecao.tsx`

Adicionar um novo botão na área `headerActions` com ícone de livro/manual (BookOpen) que navega para a página de regras.

```typescript
// Novo botão ao lado do botão de clientes e exportação
<Button 
  variant="outline" 
  size="sm" 
  className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
  onClick={() => navigate('/direcao/vendas/regras-vendas')}
>
  <BookOpen className="h-4 w-4" />
</Button>
```

#### 2. Criar Nova Página de Regras

**Arquivo:** `src/pages/direcao/RegrasVendasDirecao.tsx`

Página informativa usando o layout `MinimalistLayout` com seções em acordeão (Accordion) para organizar as regras:

**Conteúdo da Página:**

| Seção | Descrição |
|-------|-----------|
| **Descontos** | Limites cumulativos: 5% à vista, +3% presencial, +5% com senha = 13% máximo |
| **Acréscimos (Crédito)** | Regra de exclusividade com desconto, propósito do acréscimo |
| **Formas de Pagamento** | Detalhes de Boleto, À Vista, Cartão, Dinheiro |
| **Campos Obrigatórios** | Lista de campos necessários para finalizar a venda |

**Estrutura Visual:**
- Cards com gradiente azul para cada seção principal
- Badges coloridos para destacar percentuais e limites
- Ícones representativos por seção
- Texto claro e direto

#### 3. Adicionar Rota no App.tsx

**Arquivo:** `src/App.tsx`

```typescript
import RegrasVendasDirecao from "./pages/direcao/RegrasVendasDirecao";

// Na seção de rotas da Direção
<Route 
  path="/direcao/vendas/regras-vendas" 
  element={<ProtectedRoute routeKey="direcao_hub"><RegrasVendasDirecao /></ProtectedRoute>} 
/>
```

---

### Detalhes do Conteúdo da Página

#### Seção 1: Regras de Desconto

| Condição | Desconto Permitido |
|----------|-------------------|
| Pagamento à vista (não cartão) | +5% |
| Venda presencial | +3% |
| Limite sem autorização | 8% |
| Com senha do responsável | +5% adicional |
| **Limite absoluto** | **13%** |

**Observação:** Descontos acima de 13% são bloqueados pelo sistema.

#### Seção 2: Regras de Acréscimo (Crédito)

- Acréscimo adiciona valor ao total da venda
- **Não pode** ser aplicado se houver qualquer desconto
- Usado para adicionar margem extra ou serviços adicionais

#### Seção 3: Formas de Pagamento

| Método | Detalhes |
|--------|----------|
| **Boleto** | Parcelas com intervalo customizável (7, 15, 21, 28, 30, 45, 60 dias) |
| **À Vista** | Requer upload de comprovante |
| **Cartão de Crédito** | 1 a 12 parcelas |
| **Dinheiro** | Sem parâmetros adicionais |

#### Seção 4: Campos Obrigatórios

**Dados do Cliente:**
- Nome do cliente
- Telefone

**Localização (todos obrigatórios):**
- Estado
- Cidade
- CEP
- Bairro (mínimo 2 caracteres)
- Endereço (mínimo 2 caracteres)

**Produtos:**
- Mínimo 1 produto na venda

**Documentos:**
- CPF (11 dígitos) ou CNPJ (14 dígitos) - opcional mas validado

---

### Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/direcao/VendasDirecao.tsx` | Adicionar botão de navegação |
| `src/pages/direcao/RegrasVendasDirecao.tsx` | **Criar** nova página |
| `src/App.tsx` | Adicionar nova rota |

