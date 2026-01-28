
# Plano: Atualizar Regras de Desconto e Gerenciamento de Senhas

## Visão Geral

Este plano implementa as seguintes alterações nas regras de vendas:

1. **Ajustar percentuais de desconto**: À vista passa de 5% para 3%
2. **Gerenciar senhas no banco**: Senha do responsável e senha master editáveis
3. **Nova senha master**: Desbloqueia qualquer limite de desconto
4. **Responsáveis por senha**: Rastrear quem inseriu cada senha
5. **Validação de unicidade**: As duas senhas devem ser diferentes

---

## 1. Alterações no Banco de Dados

### Nova Tabela: `configuracoes_vendas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| senha_responsavel | text | Senha do líder (padrão: "1qazxsw2") |
| senha_master | text | Senha para desbloquear qualquer limite |
| responsavel_senha_responsavel_id | uuid | FK para admin_users (quem pode usar senha responsável) |
| responsavel_senha_master_id | uuid | FK para admin_users (quem pode usar senha master) |
| limite_desconto_avista | numeric | Percentual à vista (padrão: 3) |
| limite_desconto_presencial | numeric | Percentual presencial (padrão: 3) |
| limite_adicional_responsavel | numeric | % adicional com senha responsável (padrão: 5) |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data de atualização |

**RLS**: Leitura para usuários autenticados, escrita apenas para administradores.

**Dados iniciais**:
```sql
INSERT INTO configuracoes_vendas (
  senha_responsavel,
  senha_master,
  limite_desconto_avista,
  limite_desconto_presencial,
  limite_adicional_responsavel
) VALUES (
  '1qazxsw2',
  'Master@2025',
  3,
  3,
  5
);
```

---

## 2. Alterações no Código

### 2.1 Hook para Configurações de Vendas

**Novo arquivo**: `src/hooks/useConfiguracoesVendas.ts`

```typescript
// Busca e atualiza configurações de vendas
export function useConfiguracoesVendas() {
  // Query para buscar configurações
  // Mutation para atualizar configurações
  // Validação: senhas não podem ser iguais
}
```

### 2.2 Atualizar Regras de Desconto

**Arquivo**: `src/utils/descontoVendasRules.ts`

| Antes | Depois |
|-------|--------|
| `limiteBase = 5` (não cartão) | `limiteBase = 3` (não cartão) |
| Limite máximo fixo: 13% | Limite calculado dinamicamente |

**Nova lógica**:
- Sem cartão: 3%
- Presencial: 3%
- Total sem senha: 6%
- Com senha responsável: +5% = 11%
- Com senha master: sem limite

A função passará a aceitar um parâmetro opcional com as configurações do banco.

### 2.3 Página de Regras de Vendas

**Arquivo**: `src/pages/direcao/RegrasVendasDirecao.tsx`

**Novas seções**:

1. **Card de Gerenciamento de Senhas**
   - Campo para editar senha do responsável
   - Campo para editar senha master
   - Seletor de responsável para cada senha (Select com usuários)
   - Botão "Salvar Alterações"
   - Alerta de validação (senhas não podem ser iguais)

2. **Atualizar valores exibidos**
   - "Pagamento à vista (não cartão)" → de +5% para +3%
   - "Limite sem autorização" → de 8% para 6%
   - "Limite absoluto" → de 13% para 11% (ou "ilimitado com senha master")

**Layout proposto**:

```
┌─────────────────────────────────────────────────────┐
│ 🔐 Gerenciamento de Senhas                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Senha do Responsável (até +5%)                  │ │
│ │ [••••••••••••]                                  │ │
│ │ Responsável: [Select: Usuário]                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Senha Master (sem limite)                       │ │
│ │ [••••••••••••]                                  │ │
│ │ Responsável: [Select: Usuário]                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ⚠️ As senhas devem ser diferentes                   │
│                                                     │
│                              [Salvar Alterações]    │
└─────────────────────────────────────────────────────┘
```

### 2.4 Modais de Autorização

**Arquivos**:
- `src/components/vendas/AutorizacaoDescontoModal.tsx`
- `src/components/vendas/VerificacaoLiderModal.tsx`

**Alterações**:
- Remover constante `SENHA_LIDER = "Lider@2025"`
- Buscar senhas do banco via `useConfiguracoesVendas`
- Verificar tipo de autorização para usar senha correta
- Quando `tipoAutorizacao === 'master'`, aceitar senha master para liberar qualquer desconto
- Registrar qual usuário foi selecionado como responsável

### 2.5 Fluxo de Criação de Venda

**Arquivos**:
- `src/pages/vendas/VendaNovaMinimalista.tsx`
- `src/pages/VendasNova.tsx`

**Alterações**:
- Usar configurações do banco para calcular limites
- Quando senha master é usada, permitir qualquer percentual
- Remover limite máximo de 13% quando senha master é validada

---

## 3. Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| **Banco de Dados** | Criar tabela `configuracoes_vendas` |
| `src/hooks/useConfiguracoesVendas.ts` | **Criar** hook para gerenciar configurações |
| `src/utils/descontoVendasRules.ts` | Atualizar percentuais e aceitar config dinâmica |
| `src/pages/direcao/RegrasVendasDirecao.tsx` | Adicionar seção de gerenciamento de senhas |
| `src/components/vendas/AutorizacaoDescontoModal.tsx` | Usar senhas do banco |
| `src/components/vendas/VerificacaoLiderModal.tsx` | Usar senhas do banco |
| `src/pages/vendas/VendaNovaMinimalista.tsx` | Integrar nova lógica de limites |
| `src/pages/VendasNova.tsx` | Integrar nova lógica de limites |
| `src/components/vendas/DescontoVendaModal.tsx` | Atualizar exibição de limites |

---

## 4. Regras de Negócio Finais

| Condição | Desconto Permitido |
|----------|-------------------|
| Pagamento cartão de crédito | 0% |
| Pagamento à vista/boleto/dinheiro | +3% |
| Venda presencial | +3% |
| **Total sem senha** | **6%** (máximo) |
| Com senha do responsável | +5% adicional = **11%** |
| Com senha master | **Sem limite** |

---

## 5. Validações de Segurança

1. As duas senhas **não podem ser iguais** (validação client e server)
2. Alteração de senhas requer permissão de administrador
3. Senhas são armazenadas em texto (podem ser hasheadas no futuro)
4. Registro de quem usou qual senha em `vendas_autorizacoes_desconto`

---

## 6. Fluxo do Usuário

```
Vendedor aplica desconto > 6%
         │
         ▼
   ┌────────────────┐
   │ Desconto > 11%?│
   └────────┬───────┘
            │
     Sim    │    Não
     ▼      │     ▼
┌──────────┐│┌──────────────┐
│ Modal    │││ Modal        │
│ Senha    │││ Senha        │
│ Master   │││ Responsável  │
└──────────┘│└──────────────┘
            │
            ▼
    Registra autorização
    e cria venda
```
