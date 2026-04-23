

## Redesign do painel `/paineis/metas-vendas`

Reformular o painel para um visual mais imersivo, com foto grande do vendedor, lista completa de vendedores elegíveis (mesmo sem vendas), barra que muda de cor conforme o tier alcançado e cálculo de bonificação percentual corrigido.

### Mudanças

**1. `src/pages/paineis/PaineisMetasVendas.tsx`**
- Remover `MinimalistLayout` (que injeta header + breadcrumb + botão voltar). Substituir por container próprio: `min-h-screen bg-black text-white p-6`.
- Manter apenas um pequeno botão de voltar flutuante (ArrowLeft) no canto superior esquerdo, no mesmo estilo glassmórfico, sem breadcrumb nem título.
- Manter o relógio de período por meta, mas dentro de cada bloco.

**2. `src/hooks/useProgressoMetasVendas.ts`**
- Buscar **todos os vendedores elegíveis** (já há `useVendedoresElegiveis`; vamos consultar diretamente em `admin_users` filtrando por `tipo='representante'` ou roles de venda — usar a mesma lista que aparece no formulário de meta para consistência).
- Para metas `escopo='individual'` **sem `vendedor_id`**: gerar uma entrada para cada vendedor elegível (com `total_vendido = 0` se não houver venda), ordenado por `total_vendido desc, nome asc`.
- Buscar `avatar_url` em `admin_users` e expor em `VendedorProgresso.avatar_url`.
- Corrigir cálculo de bonificação percentual: hoje usa `total * (valor / 100)`. Trocar para `total * (valor / 10)` conforme regra "0,X * valor vendido" — ex.: 2% → 0,2 × valor. **Confirmação visual:** label do tier também mostrará "0,X × vendido = R$ Y".

   Observação: vou assumir que "0,X" significa que o número informado é o multiplicador direto em décimos (ex.: tier `bonificacao_valor = 2` representa `0,2 × vendido`). Caso a intenção seja `valor / 100` mantendo a label como "0,0X", ajusto após confirmação — ver pergunta opcional abaixo.

**3. `src/components/paineis/MetaVendasBarra.tsx`**
- Layout do card por vendedor:
  - **Foto grande** (h-24 w-24 rounded-2xl) à esquerda usando `Avatar` do projeto, com `AvatarImage` (avatar_url) e `AvatarFallback` (iniciais do nome).
  - À direita: nome do vendedor (texto grande), nome da meta (subtítulo), barra de progresso e linha de tiers.
- **Cor da barra**: gradiente da cor do tier alcançado atual; se nenhum tier atingido, cor neutra (`#3B82F633`); se atingiu o último tier, gradiente entre cor do penúltimo e cor do último para sensação de "topo". Implementar via segmentos coloridos: a barra é dividida em N segmentos (um por tier), cada segmento ganha sua cor própria quando atingido (escala progressiva), e a parte ainda não atingida fica translúcida.
- Atualizar fórmula da bonificação percentual exibida nos tiers para refletir a mesma regra `0,X × vendido`.

**4. Vendedores elegíveis sem vendas**
- Renderizar mesmo card (foto + barra zerada + tiers todos cinzas/inativos) para deixar claro o ponto de partida.

### Pergunta opcional para confirmar a fórmula

Se preferir, posso confirmar antes de implementar: quando o tier tem `bonificacao_valor = 2` e o vendedor vendeu R$ 10.000, a bonificação deve ser:
- (A) **R$ 2.000** (interpretação `0,X × vendido` ⇒ `2/10 × 10.000`)
- (B) **R$ 200** (mantém `valor / 100` ⇒ `2% × 10.000`, só muda a label)

Por padrão vou assumir **(A)**, que casa com o texto "0,X * o valor vendido".

### Arquivos

- `src/pages/paineis/PaineisMetasVendas.tsx` (editar)
- `src/components/paineis/MetaVendasBarra.tsx` (editar)
- `src/hooks/useProgressoMetasVendas.ts` (editar — incluir vendedores sem vendas + avatar + fórmula)

### Fora de escopo

- Não altera tabelas nem RLS.
- Não altera o formulário de cadastro de metas.
- Não altera outros painéis.

