
# Armazenar tempo do pedido em cada etapa

## Resumo
Adicionar uma coluna `tempo_permanencia_segundos` na tabela `pedidos_etapas` para registrar automaticamente quanto tempo (em horas uteis) o pedido permaneceu em cada etapa ao sair dela. Exibir esse historico em /direcao/gestao-fabrica.

## Como funciona hoje
- A tabela `pedidos_etapas` ja tem `data_entrada` e `data_saida`
- Ao avancar etapa, o codigo em `usePedidosEtapas.ts` (linha 615) ja faz `update({ data_saida: new Date().toISOString() })`
- O sistema ja possui a utilidade `calcularTempoExpediente` que calcula tempo apenas em horario comercial (7h-17h, seg-sex)
- Porem nenhum tempo calculado e salvo -- ele so e exibido em tempo real via cronometro

## Mudancas

### 1. Migracao SQL
Adicionar coluna `tempo_permanencia_segundos` (tipo `numeric`, nullable) na tabela `pedidos_etapas`:

```sql
ALTER TABLE pedidos_etapas 
ADD COLUMN tempo_permanencia_segundos numeric;
```

Tambem preencher retroativamente os registros que ja tem `data_entrada` e `data_saida` usando uma funcao SQL que calcula horas uteis (7h-17h, seg-sex, fuso America/Sao_Paulo).

### 2. Calcular ao fechar etapa (usePedidosEtapas.ts)
No momento de fechar a etapa atual (linha ~612-617), antes de fazer o update de `data_saida`:
- Calcular `calcularTempoExpediente(new Date(etapaAtual.data_entrada), new Date())`
- Incluir `tempo_permanencia_segundos` no update junto com `data_saida`

Tambem aplicar a mesma logica na funcao RPC `retroceder_pedido_para_etapa` (backlog), para que retrocessos tambem registrem o tempo.

### 3. Exibir historico de tempos em gestao-fabrica
No componente `PedidoDetalhesSheet` (sidebar de detalhes do pedido), adicionar uma secao "Tempo por Etapa" que:
- Busca todos os registros de `pedidos_etapas` do pedido
- Exibe uma lista com etapa, tempo formatado (ex: "2d 4h 30min") e datas de entrada/saida
- Etapa atual mostra o cronometro em tempo real (ja existente)

### Arquivos envolvidos
- Migracao SQL (nova coluna + preenchimento retroativo)
- `src/hooks/usePedidosEtapas.ts` (salvar tempo ao fechar etapa)
- `src/components/pedidos/PedidoDetalhesSheet.tsx` (exibir historico de tempos)
- Funcao RPC `retroceder_pedido_para_etapa` (salvar tempo ao retroceder)
