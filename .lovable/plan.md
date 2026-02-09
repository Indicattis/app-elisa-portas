
# Remover breadcrumb duplicado em Ordens de Instalacao

## Problema

A pagina `OrdensInstalacoesLogistica.tsx` usa o `MinimalistLayout`, que ja renderiza automaticamente um `AnimatedBreadcrumb`. Alem disso, a pagina renderiza manualmente um segundo `AnimatedBreadcrumb` na linha 235, causando dois breadcrumbs sobrepostos.

## Solucao

Remover o `AnimatedBreadcrumb` manual da pagina e passar os itens corretos de breadcrumb via prop `breadcrumbItems` do `MinimalistLayout`.

## Alteracoes

### Arquivo: `src/pages/logistica/OrdensInstalacoesLogistica.tsx`

1. Remover o import de `AnimatedBreadcrumb` (linha 21)
2. Remover a constante `breadcrumbItems` (linhas 211-215)
3. Atualizar o `MinimalistLayout` (linha 218) para incluir as props `backPath` e `breadcrumbItems` corretas:
   - `backPath="/logistica/instalacoes"`
   - `breadcrumbItems` com Home > Logistica > Instalacoes > Ordens de Instalacao
4. Remover o bloco do header (linhas 226-236) que contem o botao voltar manual e o `AnimatedBreadcrumb` duplicado, ja que o `MinimalistLayout` ja fornece ambos
