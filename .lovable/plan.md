

## Plano: Acordos read-only em /direcao/autorizados

### O que sera feito

Tornar a secao de acordos em `AutorizadosPrecosDirecao.tsx` read-only quando `contexto === 'direcao'`:

**Arquivo: `src/pages/direcao/AutorizadosPrecosDirecao.tsx`**

1. **Mostrar acordos sempre** -- remover a condicao `contexto !== 'logistica'` que esconde a secao de acordos, para que apareça tanto em direcao quanto logistica
2. **Esconder botao "Novo Acordo"** no header quando `contexto === 'direcao'` (ja esta assim)
3. **Remover coluna "Acoes"** (edit/delete dropdown) quando `contexto === 'direcao'` -- esconder o `TableHead` e `TableCell` de acoes
4. **Ajustar empty state** -- quando nao ha acordos no contexto direcao, mostrar apenas mensagem sem botao "Criar Primeiro Acordo"
5. **Adicionar coluna "Excesso"** na tabela (igual as outras paginas) -- calculo `valor_acordado - soma(portas.valor_unitario)` com cores verde/vermelho
6. **Remover dialogs de CRUD** (NovoAcordoDialog e AlertDialog de delete) quando `contexto === 'direcao'`

### Resultado

Em `/direcao/autorizados` os acordos aparecerao na tabela com todas as informacoes (incluindo excesso) mas sem nenhuma opcao de criar, editar ou excluir.

