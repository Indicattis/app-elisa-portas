

# Corrigir impossibilidade de adicionar linhas em pedidos sem portas

## Problema

O pedido `5cb99bc7` esta vinculado a uma venda que possui apenas produtos do tipo "adicional" (sem portas de enrolar ou social). Quando nao existem linhas e nenhuma porta, o componente `PedidoLinhasEditor` entra num estado "morto":

1. O usuario clica em "Adicionar Produto" (`novaLinha = true`)
2. O componente sai do estado vazio (linha 928)
3. Renderiza o grid de pastas -- que esta vazio (sem portas, sem linhas)
4. O formulario de nova linha so aparece dentro de `renderLinhasTable`, que so e chamado quando uma pasta esta aberta
5. Sem pastas, nao ha onde abrir, e o formulario nunca aparece

## Solucao

Quando `novaLinha` estiver ativo e nao houver nenhuma pasta aberta (nem pastas disponiveis), renderizar o formulario de nova linha diretamente, fora do contexto de pastas.

## Detalhe tecnico

### Arquivo: `src/components/pedidos/PedidoLinhasEditor.tsx`

Na secao apos o grid de pastas (linha ~1012), antes do botao global de adicionar (linha 1014), adicionar uma condicao para renderizar a tabela com o formulario de nova linha quando:
- `novaLinha` esta ativo
- Nenhuma pasta esta aberta (`!pastaAberta`)
- Nao ha pastas disponiveis OU o usuario quer adicionar sem contexto de porta

```typescript
// Apos o bloco da pasta expandida (linha ~1012)
// Formulario de nova linha quando nao ha pasta aberta
{!isReadOnly && novaLinha && !pastaAberta && (
  <div className="border rounded-lg overflow-hidden">
    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
      <span className="text-sm font-semibold">Novo item</span>
    </div>
    <div className="p-2">
      {renderLinhasTable([])}
    </div>
  </div>
)}
```

Tambem ajustar o botao de confirmar na linha 842 para nao exigir `produto_venda_id` quando nao ha portas de enrolar:

```typescript
// Linha 842: a condicao ja esta correta
disabled={(temPortasEnrolar && !rascunhoLinha.produto_venda_id) || !rascunhoLinha.estoque_id}
```

A condicao `temPortasEnrolar` ja permite que o botao funcione sem porta selecionada. Portanto a unica mudanca necessaria e exibir o formulario fora do grid de pastas.

Alem disso, remover o botao global "Adicionar Produto" quando `novaLinha` ja esta ativo, para nao duplicar (ja esta coberto pela condicao `!novaLinha` na linha 1015).

## Arquivos modificados

1. **Editar**: `src/components/pedidos/PedidoLinhasEditor.tsx` -- renderizar formulario de nova linha quando nenhuma pasta disponivel/aberta
