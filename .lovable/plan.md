

## Fluxo Completo do Sistema de Descontos

### 1. Configuração (Regras de Vendas)
- **Tabela `configuracoes_vendas`** armazena:
  - `limite_desconto_avista` (padrão 3%) — para pagamentos que não sejam cartão de crédito
  - `limite_desconto_presencial` (padrão 5%) — adicional para vendas presenciais
  - `limite_adicional_responsavel` (padrão 5%) — adicional com senha do responsável
  - `senha_responsavel` e `senha_master` — senhas para autorização
- Gerenciado em `/direcao/vendas/regras-vendas`

### 2. Aplicação do Desconto (Modal `DescontoVendaModal`)
- Vendedor seleciona produtos e define desconto (% ou valor fixo)
- O desconto é distribuído proporcionalmente entre os produtos selecionados
- Cada produto recebe campos: `tipo_desconto` ('percentual' | 'valor'), `desconto_percentual`, `desconto_valor`
- O modal mostra preview e badges indicando se está dentro do limite, requer senha do responsável ou senha master

### 3. Cálculo de Limites (`descontoVendasRules.ts`)
```text
Limite Base = pagamento não-cartão? 3% : 0%
Limite Presencial = venda presencial? 5% : 0%
Limite Total (sem senha) = Base + Presencial (ex: 8%)
Limite Máximo (com responsável) = Total + 5% (ex: 13%)
Com senha master = SEM LIMITE
```

### 4. Validação no Submit (`VendaNovaMinimalista.tsx`)
- Ao submeter a venda, `validarDesconto()` calcula o % total de desconto sobre o total da venda
- Se dentro do limite → venda criada normalmente
- Se excede limite mas ≤ limite máximo → abre `AutorizacaoDescontoModal` pedindo senha do responsável (líder de vendas)
- Se excede limite máximo → abre modal pedindo senha master

### 5. Persistência no Banco
- **`produtos_vendas`**: cada linha salva com `tipo_desconto`, `desconto_percentual`, `desconto_valor` (itens com qty ≥ 2 são splitados em linhas individuais com qty=1, mantendo o desconto por unidade)
- **`vendas`**: `valor_venda` = total já com desconto aplicado; `valor_credito` e `percentual_credito` a nível de venda
- **`vendas_autorizacoes_desconto`**: registro de autorização com `tipo_autorizacao` (responsavel_setor | master), `autorizado_por`, `solicitado_por`, `percentual_desconto`, `senha_usada`

### 6. Fluxo de Edição (`VendaEditarMinimalista.tsx`)
- O desconto pode ser reaplicado via o mesmo modal
- Atualiza diretamente os `produtos_vendas` no banco e recalcula `valor_venda`

### 7. Restrições Importantes
- Desconto e crédito são **mutuamente exclusivos** — aplicar desconto zera o crédito e vice-versa
- Vendas com crédito não podem ter desconto
- O `valor_total` de cada produto no banco já inclui o desconto aplicado (calculado como `(valor_produto + valor_pintura + valor_instalacao) * qty - desconto`)

### Observação sobre `senha_usada`
No código de `VendaNovaMinimalista.tsx` linha 551, a senha é hardcoded como `'1qazxsw2'` — a senha real digitada pelo autorizador não está sendo passada para o registro. Isso pode ser intencional (não armazenar a senha real) ou um bug.

---

Esse é o fluxo completo. Quer que eu faça alguma alteração nesse sistema?

