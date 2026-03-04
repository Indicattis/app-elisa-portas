

# Ranking de Carregamentos: mostrar colaboradores que realizaram carregamentos

## Problema

O card "Carregamentos" mostra o número correto (1 carregamento) vindo da RPC `get_portas_por_etapa`, mas o mini-ranking abaixo fica vazio porque o hook `useDesempenhoEtapas` só busca dados da tabela `pontuacao_colaboradores`, que não possui registros do tipo "carregamento". O campo `carregamentos` de cada colaborador fica sempre em 0.

## Solução

No hook `useDesempenhoEtapas` (`src/hooks/useDesempenhoEtapas.ts`), após buscar e processar os dados de `pontuacao_colaboradores`, fazer uma consulta adicional nas 3 tabelas que registram carregamentos concluídos (`ordens_carregamento`, `instalacoes` e `correcoes`), filtrando por `carregamento_concluido = true` e pela data de conclusão (`carregamento_concluido_em`) dentro do período selecionado. Agrupar por `carregamento_concluido_por` para contar quantos carregamentos cada colaborador realizou.

### Detalhes técnicos

Em `src/hooks/useDesempenhoEtapas.ts`:

1. Após o bloco do switch/for das pontuações, executar 3 queries em paralelo:
   - `ordens_carregamento` onde `carregamento_concluido = true` e `carregamento_concluido_em` no período
   - `instalacoes` com mesmos filtros
   - `correcoes` com mesmos filtros

2. Selecionar apenas `carregamento_concluido_por` de cada tabela

3. Contar ocorrências por `carregamento_concluido_por` e somar ao campo `carregamentos` de cada colaborador no map (criando a entrada se não existir)

4. Incluir esses novos `user_id`s na busca de nomes/fotos em `admin_users`

Arquivo afetado: `src/hooks/useDesempenhoEtapas.ts`

