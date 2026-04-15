

## Diagnóstico

A venda `56e4efeb-3792-408a-9283-297cb21954ec` foi cadastrada **hoje** mas as duas portas ainda têm `valor_instalacao: 2300` e **nenhum produto `tipo_produto: 'instalacao'` foi criado**. Existem duas causas possíveis:

1. **Cache do navegador**: O usuário pode ter aberto a página antes do deploy e o código antigo ainda estava ativo
2. **Segundo caminho de save**: O `useVendas.ts` tem dois métodos de criação — `cadastrarVenda` (linha ~170) e `cadastrarRascunho` (linha ~530). Ambos passam `valor_instalacao: produto.valor_instalacao` diretamente (linhas 341 e 609), sem interceptar para criar o produto separado de instalação

O problema principal é que a separação da instalação acontece **apenas no formulário** (`ProdutoVendaForm.tsx`), mas o hook `useVendas.ts` que salva no banco **não valida nem força** a separação. Se por qualquer motivo o `valor_instalacao` chegar populado no array de produtos, ele é salvo assim.

## Plano de correção

### 1. Proteção no hook `useVendas.ts` (ambos os métodos de save)
Antes de inserir os produtos no DB, adicionar lógica que:
- Para cada produto `porta_enrolar` ou `porta_social` com `valor_instalacao > 0`:
  - Zerar o `valor_instalacao` do produto original
  - Criar um produto adicional `tipo_produto: 'instalacao'` com `valor_produto = valor_instalacao`
- Isso garante que **independente do formulário**, a separação sempre acontece no save

### 2. Corrigir os dados desta venda específica
Usar o insert tool para:
- Inserir 2 novos produtos `tipo_produto: 'instalacao'` (um para cada porta, valor 2300 cada)
- Atualizar as 2 portas existentes zerando `valor_instalacao` (o trigger recalcula `valor_total` automaticamente)

### 3. Atualizar o trigger DB (opcional mas recomendado)
O trigger `calcular_valores_produto` poderia ignorar `valor_instalacao` para produtos do tipo `porta_enrolar`/`porta_social` como camada extra de proteção, mas isso pode quebrar vendas legadas já faturadas. Melhor não mexer.

### Arquivos impactados
- `src/hooks/useVendas.ts` — interceptar nos dois métodos de save (`cadastrarVenda` e `cadastrarRascunho`)
- Dados da venda `56e4efeb-...` — migração pontual via insert tool

