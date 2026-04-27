# Destacar Porta Social nas downbars de produção

## Objetivo

Em todas as downbars de produção (Soldagem, Perfiladeira, Separação, Pintura, Embalagem, Qualidade), exibir um destaque visual quando o pedido associado possuir uma ordem de Porta Social (terceirização), informando o status atual dessa ordem.

## Escopo

- Componente único impactado: `src/components/production/OrdemDetalhesSheet.tsx` — usado por todas as 6 etapas de produção (`ProducaoSolda`, `ProducaoPerfiladeira`, `ProducaoSeparacao`, `ProducaoPintura`, `ProducaoEmbalagem`, `ProducaoQualidade`).
- A `TerceirizacaoDownbar` (a própria página de terceirização) **não** entra no escopo — ela já é a ordem de porta social.

## Comportamento

1. Ao abrir a downbar de qualquer ordem de produção, consultar `ordens_porta_social` filtrando por `pedido_id` da ordem aberta.
2. Se existir uma ordem de Porta Social vinculada, renderizar um banner de destaque no topo do conteúdo scrollável (logo após o header), com:
   - Ícone + título "Pedido com Porta Social (Terceirizada)"
   - Número da ordem (`numero_ordem`)
   - Badge de status, com cores semânticas:
     - `pendente` → âmbar ("Aguardando produção")
     - `em_producao` / `capturada` → azul ("Em produção pelo fornecedor")
     - `concluido` / `concluida` → verde ("Concluída")
     - Outros → cinza (label cru)
   - Nome do delegado (se `delegado_para_id` preenchido — buscar via join em `admin_users`)
   - Indicador "Em backlog" (vermelho) quando `em_backlog = true`
3. Se não houver ordem de Porta Social para o pedido, nenhum banner é renderizado (zero impacto visual).

## Implementação técnica

1. **Novo hook** `src/hooks/usePedidoPortaSocialStatus.ts`:
   - Recebe `pedidoId` (opcional, só busca se `enabled` e `pedidoId` definido).
   - `select` em `ordens_porta_social` retornando `id, numero_ordem, status, em_backlog, delegado_para_id, delegado_em, admin_users:delegado_para_id(nome, foto_perfil_url)`.
   - `.maybeSingle()` (uma ordem por pedido, conforme regra atual).
   - `queryKey: ['pedido-porta-social-status', pedidoId]`.
2. **`OrdemDetalhesSheet.tsx`**:
   - Importar e chamar o hook com `ordem?.pedido_id`, habilitado apenas quando `open && ordem?.pedido_id`.
   - Adicionar um componente inline `<PortaSocialBanner ordem={portaSocial} />` no início da seção scrollável (linha ~608, antes do banner de "ordem disponível").
   - Banner segue o padrão glassmorfo do projeto (`bg-white/5`, `backdrop-blur-xl`, `border-white/10`) ou o equivalente já usado nos banners da própria sheet (ex.: `bg-primary/5 border-primary/30`), ajustando a cor do borde por status.
3. Mapa de cores/labels de status definido localmente como constante para reuso.

## Fora do escopo

- Não alterar lógica de auto-avanço ou criação automática da ordem de Porta Social.
- Não modificar `TerceirizacaoDownbar`.
- Não criar tela nova; apenas o banner informativo.

## Arquivos afetados

- **Criado**: `src/hooks/usePedidoPortaSocialStatus.ts`
- **Editado**: `src/components/production/OrdemDetalhesSheet.tsx`
