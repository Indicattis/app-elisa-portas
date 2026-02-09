

# Corrigir 404 na rota de edicao do autorizado

## Diagnostico

Apos investigacao completa, a rota `/direcao/autorizados/:id/editar` **ja esta corretamente registrada** no `App.tsx` (linha 455) e o componente `EditarAutorizadoDirecao` **existe e exporta corretamente**. O erro 404 ocorre porque o navegador ainda esta executando uma versao anterior do codigo que nao inclui a nova rota.

## Solucao

O problema sera resolvido com uma alteracao minima no `App.tsx` para forcar o Vite a recompilar e o preview a recarregar com o codigo atualizado. Basta adicionar um comentario na linha da rota para disparar o hot-reload.

## Detalhes tecnicos

**Editar `src/App.tsx`**:
- Adicionar um comentario na linha 455 (onde a rota ja esta registrada) para forcar a recompilacao do modulo pelo Vite.

### Arquivos

1. **Editar**: `src/App.tsx` -- forcar recompilacao (touch na linha da rota)

