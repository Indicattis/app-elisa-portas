

# Adicionar rotas de Embalagem e Instalacoes nas permissoes

## Resumo
Inserir 2 novos registros na tabela `app_routes` para que as paginas `/producao/embalagem` e `/producao/instalacoes` aparecam no gerenciamento de permissoes em `/admin/permissions` dentro da interface "Producao".

## O que sera feito

1. **Inserir rota `producao_embalagem`** na tabela `app_routes` com:
   - key: `producao_embalagem`
   - path: `/producao/embalagem`
   - label: `Embalagem`
   - interface: `producao`
   - sort_order: 7 (entre Pintura=6 e Carregamento=8)

2. **Inserir rota `producao_instalacoes`** na tabela `app_routes` com:
   - key: `producao_instalacoes`
   - path: `/producao/instalacoes`
   - label: `Instalacoes`
   - interface: `producao`
   - sort_order: 8 (apos Embalagem)

3. **Reordenar rotas existentes** para acomodar as novas:
   - Carregamento: sort_order 7 -> 9
   - Terceirizacao: sort_order 8 -> 10
   - Conferencia Estoque: sort_order 10 -> 11
   - Conferencia Almoxarifado: sort_order 11 -> 12

Nenhuma alteracao de codigo e necessaria. O componente `UserRouteAccessManager` ja busca todas as rotas ativas da interface selecionada dinamicamente.

## Secao Tecnica

### SQL a executar (INSERT, nao migration)
```text
-- Reordenar existentes
UPDATE app_routes SET sort_order = 9 WHERE key = 'producao_carregamento';
UPDATE app_routes SET sort_order = 10 WHERE key = 'producao_terceirizacao';
UPDATE app_routes SET sort_order = 11 WHERE key = 'producao_conferencia_estoque';
UPDATE app_routes SET sort_order = 12 WHERE key = 'producao_conferencia_almox';

-- Inserir novas rotas
INSERT INTO app_routes (key, path, label, interface, sort_order, active)
VALUES 
  ('producao_embalagem', '/producao/embalagem', 'Embalagem', 'producao', 7, true),
  ('producao_instalacoes', '/producao/instalacoes', 'Instalações', 'producao', 8, true);
```

### Arquivos afetados
Nenhum arquivo de codigo precisa ser alterado — apenas dados no banco.

