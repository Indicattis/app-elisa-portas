
# Plano: Permitir Resolver Problema de Linha para Continuar Producao

## Problema Identificado

A ordem OPE-2026-0038 tem uma linha marcada com `com_problema: true`, mas nao ha nenhum botao na interface para resolver/limpar esse problema. Isso impede o responsavel de continuar trabalhando na ordem.

### Estado atual da ordem:
- **Status:** pendente
- **Pausada:** false
- **Responsavel:** Atribuido
- **Linha com problema:** 1 de 17 linhas (id: 82892125-5608-441a-b5e7-ac4b25ec1a37)

### O que esta bloqueado:
- O checkbox da linha com problema esta desabilitado
- Nao e possivel concluir a ordem enquanto houver linhas com problema
- Nao existe botao para resolver/limpar o problema

## Solucao

Adicionar um botao "Resolver Problema" nas linhas marcadas com `com_problema`, permitindo que o responsavel pela ordem limpe o flag e continue a producao.

---

## Detalhes Tecnicos

### Arquivos a modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/production/OrdemDetalhesSheet.tsx` | Adicionar props e botao para resolver problema |
| `src/pages/fabrica/producao/PerfiladeiraMinimalista.tsx` | Passar `resolverProblemaLinha` para o Sheet |
| `src/pages/fabrica/producao/SoldaMinimalista.tsx` | Passar `resolverProblemaLinha` para o Sheet |
| `src/pages/fabrica/producao/SeparacaoMinimalista.tsx` | Passar `resolverProblemaLinha` para o Sheet |

### 1. Modificar OrdemDetalhesSheet.tsx

Adicionar novas props na interface:

```typescript
interface OrdemDetalhesSheetProps {
  // ... props existentes
  onResolverProblemaLinha?: (linhaId: string) => void;
  isResolvingProblem?: boolean;
}
```

Adicionar botao na renderizacao das linhas com problema (ao lado do icone de alerta):

```tsx
{linha.com_problema && isResponsavel && onResolverProblemaLinha && (
  <Button
    variant="ghost"
    size="sm"
    className="h-11 w-11 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
    onClick={(e) => {
      e.preventDefault();
      onResolverProblemaLinha(linha.id);
    }}
    disabled={isResolvingProblem}
    title="Problema resolvido - liberar linha"
  >
    <CheckCircle2 className="h-5 w-5" />
  </Button>
)}
```

### 2. Modificar paginas de producao

Exemplo para PerfiladeiraMinimalista.tsx:

```typescript
// Na desestruturacao do hook
const {
  // ... existentes
  resolverProblemaLinha, // Adicionar
} = useOrdemProducao('perfiladeira', tentarAvancoAutomatico);

// Handler
const handleResolverProblema = (linhaId: string) => {
  resolverProblemaLinha.mutate({ linhaId });
};

// No componente OrdemDetalhesSheet
<OrdemDetalhesSheet
  // ... props existentes
  onResolverProblemaLinha={handleResolverProblema}
  isResolvingProblem={resolverProblemaLinha.isPending}
/>
```

### Fluxo de uso

1. Operador abre a ordem com linha com problema
2. Linha aparece em vermelho com icone de alerta
3. Ao lado do alerta, aparece botao verde de "check" (resolver)
4. Ao clicar, o sistema limpa `com_problema`, `problema_descricao`, etc
5. Linha volta ao estado normal e pode ser marcada como concluida

---

## Resultado Esperado

O responsavel pela ordem OPE-2026-0038 podera:
1. Abrir a ordem no detalhe
2. Ver a linha com problema destacada em vermelho
3. Clicar no botao verde para resolver o problema
4. Continuar trabalhando normalmente na ordem
