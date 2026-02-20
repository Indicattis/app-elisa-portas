

# Corrigir salvamento de dados na pagina de edicao de produto

## Problema identificado

A pagina de edicao de produto (`EstoqueEditMinimalista.tsx`) tem um bug onde as alteracoes do formulario sao perdidas antes de salvar. Isso ocorre por dois motivos:

1. **useEffect reseta o formulario**: O `useEffect` que popula o formulario roda toda vez que `produto` muda. O React Query refaz a busca automaticamente quando a janela recupera foco ou quando o staleTime expira, causando o `useEffect` a sobrescrever as alteracoes do usuario com os dados antigos do banco.

2. **Dados nao persistidos na query key**: Apos salvar com sucesso, a mutation invalida `["estoque"]` mas nao invalida `["produto", id]`, entao se o usuario voltasse a pagina, veria dados desatualizados. Porem como o codigo navega apos salvar, isso e secundario.

## Solucao

### Alteracao em `src/pages/administrativo/EstoqueEditMinimalista.tsx`

1. **Proteger o useEffect contra sobrescrita**: Alterar o `useEffect` para popular o formulario apenas na primeira vez que os dados sao carregados, usando o estado `dadosCarregados` como guarda:

```typescript
useEffect(() => {
  if (produto && !dadosCarregados) {
    const newFormData = {
      nome_produto: produto.nome_produto || "",
      descricao_produto: produto.descricao_produto || "",
      setor_responsavel_producao: produto.setor_responsavel_producao || "",
      requer_pintura: produto.requer_pintura === true,
      modulo_calculo: produto.modulo_calculo || "",
      valor_calculo: Number(produto.valor_calculo) || 0,
      eixo_calculo: produto.eixo_calculo || "",
      item_padrao_porta_enrolar: produto.item_padrao_porta_enrolar === true,
    };
    setFormData(newFormData);
    setDadosCarregados(true);
  }
}, [produto, dadosCarregados]);
```

A unica mudanca e adicionar `&& !dadosCarregados` na condicao. Isso garante que o formulario so e populado uma vez, e os refetches automaticos do React Query nao sobrescrevem as edicoes do usuario.

2. **Invalidar a query do produto apos salvar**: No `handleSubmit`, apos o save bem-sucedido, invalidar tambem a query `["produto", id]` para manter consistencia:

```typescript
import { useQueryClient } from "@tanstack/react-query";

// Dentro do handleSubmit, apos editarProduto:
queryClient.invalidateQueries({ queryKey: ["produto", id] });
```

3. **Corrigir valor_calculo zero**: Na construcao de `dadosParaSalvar`, o `valor_calculo: formData.valor_calculo || null` transforma `0` em `null`. Corrigir para:

```typescript
valor_calculo: formData.valor_calculo !== 0 ? formData.valor_calculo : 0,
```

Ou mais simplesmente, nao usar `||` e deixar como esta, ja que se o usuario digitou 0, provavelmente quer null mesmo. Mas por seguranca, usar uma verificacao explicita.

## Resultado esperado

- As alteracoes em modulo de calculo, eixo de calculo, valor de calculo e demais campos serao preservadas no formulario ate o momento de salvar
- O botao "Salvar Alteracoes" enviara todos os dados corretamente ao banco
- A query do produto sera invalidada apos salvar, mantendo o cache atualizado

