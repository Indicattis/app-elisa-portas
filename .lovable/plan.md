
# Plano: Corrigir Navegacao entre /fabrica/producao e Setores

## Problema Identificado

O componente `ProducaoMinimalista.tsx` usa um `replace` incorreto para mapear as rotas:

```typescript
// ATUAL (incorreto)
const minimalPath = route.path.replace('/hub-fabrica/producao/', '/fabrica/producao/');

// Rotas no banco: /producao/solda, /producao/pintura, etc.
// Resultado: /producao/solda (nao muda nada!)
```

## Solucao

Corrigir o replace para mapear corretamente de `/producao/` para `/fabrica/producao/`:

```typescript
// CORRETO
const minimalPath = route.path.replace('/producao/', '/fabrica/producao/');

// Rotas no banco: /producao/solda
// Resultado: /fabrica/producao/solda ✓
```

---

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/fabrica/ProducaoMinimalista.tsx` | Corrigir linha 148 do replace |

---

## Codigo Corrigido

```typescript
onClick={() => {
  // Mapear paths da tabela para paths minimalistas
  const minimalPath = route.path.replace('/producao/', '/fabrica/producao/');
  navigate(minimalPath);
}}
```

---

## Fluxo Corrigido

```text
ANTES (problema):
/fabrica/producao → clica "Solda" → /producao/solda → voltar → /producao/home ✗

DEPOIS (corrigido):
/fabrica/producao → clica "Solda" → /fabrica/producao/solda → voltar → /fabrica/producao ✓
```

---

## Resultado Esperado

- Navegacao consistente dentro da interface minimalista `/fabrica/*`
- Botao "Voltar" retorna corretamente para `/fabrica/producao`
- Usuarios da interface `/fabrica` nao sao mais redirecionados para `/producao`
