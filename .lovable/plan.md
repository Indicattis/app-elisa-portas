
# Adicionar gestao de precos de instalacao na pagina de edicao do autorizado

## Resumo

Adicionar uma secao de precos de instalacao por tamanho de porta (P, G, GG) na pagina de edicao do autorizado (`EditarAutorizadoDirecao.tsx`), reutilizando a logica de upsert ja existente no hook `useAutorizadosPrecos`.

## Detalhes tecnicos

### Arquivo: `src/pages/direcao/EditarAutorizadoDirecao.tsx`

1. **Importar** o cliente supabase ja existente para buscar/salvar precos da tabela `autorizado_precos_portas`

2. **Adicionar estado** para os precos:
   - `precos: { P: number, G: number, GG: number }` inicializado com `{ P: 0, G: 0, GG: 0 }`
   - `savingPrecos: boolean`

3. **Fetch dos precos** no `fetchParceiro` (ou em useEffect separado): query a `autorizado_precos_portas` filtrando por `autorizado_id = id`, montando o objeto `{ P, G, GG }`

4. **Salvar precos** no `handleSubmit`: apos salvar o autorizado, fazer upsert dos 3 tamanhos na tabela `autorizado_precos_portas` (mesma logica do `upsertPrecos` do hook existente)

5. **Nova secao no formulario**: entre "Cidades Secundarias" e os botoes de acao, adicionar um bloco com titulo "Precos de Instalacao" contendo 3 campos de input numerico (R$ P, R$ G, R$ GG) com os labels indicando a faixa de metragem (< 25m2, 25-50m2, > 50m2), seguindo o mesmo estilo visual dark da pagina (bg-white/5, border-white/10, text-white)

### Nenhuma alteracao no banco de dados
A tabela `autorizado_precos_portas` ja existe com as colunas necessarias (`autorizado_id`, `tamanho`, `valor`, `created_by`, `updated_at`) e constraint unica em `(autorizado_id, tamanho)`.
