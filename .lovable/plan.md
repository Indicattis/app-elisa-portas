
## Plano: Corrigir Exibição de Dados em Instalações Avulsas

### Problema Identificado

A ordem "Ederson Stringhini" é uma **instalação avulsa** (tabela `instalacoes`) que:
- **Não tem** `venda_id` nem `pedido_id` vinculados
- **Tem dados próprios** na tabela `instalacoes`:
  - `cidade`: Bento Gonçalves
  - `estado`: RS
  - `endereco`: R. Alfredo Zanoni N 152, Condomínio Mirante do Vale
  - `telefone_cliente`: (54) 8115 - 8344
  - `cor_id`: Cinza Escuro (#2b2b2b)

O hook `useOrdensCarregamentoCalendario` **não busca** esses campos próprios da instalação, e o componente `OrdemCarregamentoDetails` só verifica dados da venda vinculada.

---

### Correção 1: Hook - Buscar Campos Próprios

**Arquivo:** `src/hooks/useOrdensCarregamentoCalendario.ts`

Adicionar campos na query de instalações:

```typescript
// Linha 82-122: Adicionar campos próprios
.select(`
  id,
  nome_cliente,
  data_carregamento,
  hora_carregamento,
  tipo_carregamento,
  responsavel_carregamento_id,
  responsavel_carregamento_nome,
  status,
  carregamento_concluido,
  observacoes,
  created_at,
  updated_at,
  cidade,           // ADICIONAR
  estado,           // ADICIONAR
  cep,              // ADICIONAR
  endereco,         // ADICIONAR
  telefone_cliente, // ADICIONAR
  cor:catalogo_cores(  // ADICIONAR
    nome,
    codigo_hex
  ),
  pedido:pedidos_producao(...),
  venda:vendas(...)
`)
```

---

### Correção 2: Hook - Normalizar com Fallback

**Arquivo:** `src/hooks/useOrdensCarregamentoCalendario.ts`

Atualizar a normalização para criar uma "venda virtual" com dados próprios:

```typescript
// Linha 131-163: Normalização com fallback
const instalacoesNormalizadas = (instalacoes || []).map((inst: any) => {
  // Se tem venda vinculada, usar dados da venda
  // Senão, criar objeto com dados próprios da instalação
  const vendaOuDadosProprios = inst.venda || (inst.cidade || inst.endereco ? {
    id: null,
    cliente_nome: inst.nome_cliente,
    cliente_telefone: inst.telefone_cliente,
    cliente_email: null,
    cidade: inst.cidade,
    estado: inst.estado,
    cep: inst.cep,
    bairro: inst.endereco, // endereco contém endereço completo
    data_prevista_entrega: null,
    tipo_entrega: 'instalacao',
    produtos: inst.cor ? [{
      tipo_produto: 'porta_enrolar',
      tamanho: null,
      largura: null,
      altura: null,
      quantidade: 1,
      cor: inst.cor
    }] : []
  } : null);

  return {
    ...resto,
    venda: vendaOuDadosProprios
  };
});
```

---

### Correção 3: Downbar - Usar Dados com Fallback

**Arquivo:** `src/components/expedicao/OrdemCarregamentoDetails.tsx`

O componente já está preparado para mostrar os dados - a correção no hook será suficiente.

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useOrdensCarregamentoCalendario.ts` | Buscar campos próprios da instalação e criar fallback para venda |

---

### Resultado Esperado

Após a correção, a downbar de "Ederson Stringhini" exibirá:

```text
+------------------------------------------+
|  [Instalação]  [Pendente Produção]       |
|  EDERSON STRINGHINI                      |
|  📞 (54) 8115 - 8344                     |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | ENDEREÇO DE ENTREGA                |  |
|  | 📍 Bento Gonçalves - RS            |  |
|  |    R. Alfredo Zanoni N 152,        |  |
|  |    Condomínio Mirante do Vale      |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | PORTAS DE ENROLAR (1)              |  |
|  | +--------------------------------+ |  |
|  | | [████] Cinza Escuro            | |  |
|  | +--------------------------------+ |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | CARREGAMENTO                       |  |
|  | Data: 06/01/2026                   |  |
|  | Responsável: Elisa                 |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```
