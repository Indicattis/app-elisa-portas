

# Substituir veiculos de frota por equipes de instalacao no responsavel "Elisa" para entregas

## Resumo
Alterar os 3 componentes de agendamento/edicao de expedicao para que, quando o tipo de responsavel for "Elisa" em entregas, o select mostre equipes de instalacao em vez de veiculos de frota. Isso unifica o comportamento: tanto entregas quanto instalacoes usarao equipes internas quando "Elisa" for selecionado.

## Alteracoes

### 1. `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx`
- Remover import e uso de `useVeiculos`
- No `handleConfirm`, quando `isEntrega && responsavelTipo === 'elisa'`, buscar o nome na lista `equipes` em vez de `veiculos`
- No render do Select, quando `isEntrega && responsavelTipo === 'elisa'`, listar `equipes` em vez de `veiculos`
- Alterar label de "Veiculo" para "Equipe" quando `isEntrega && responsavelTipo === 'elisa'`
- Remover referencia a `loadingVeiculos` nos disabled/placeholders

### 2. `src/components/expedicao/AgendarCarregamentoModal.tsx`
- Remover import e uso de `useVeiculos`
- No `handleConfirm`, quando `isEntrega && responsavelTipo === 'elisa'`, buscar nome na lista `equipes`
- No render do Select, listar `equipes` em vez de `veiculos` para entregas com tipo "elisa"
- Alterar label de "Veiculo" para "Equipe"
- Remover referencia a `loadingVeiculos`

### 3. `src/components/expedicao/EditarOrdemCarregamentoDrawer.tsx`
- Remover import e uso de `useVeiculos`
- No `handleSave`, quando `isEntrega && responsavelTipo === 'elisa'`, buscar responsavel na lista `responsaveis` (que ja contem equipes) em vez de `veiculos`
- No render do Select, listar `responsaveis` (equipes) em vez de `veiculos` para entregas com tipo "elisa"
- Alterar label de "Veiculo" para "Equipe"
- Remover referencia a `loadingVeiculos`

## Impacto
- As equipes de instalacao (tabela `equipes_instalacao`) passam a ser usadas para todos os agendamentos do tipo "Elisa", independente de ser entrega ou instalacao
- Os veiculos de frota deixam de ser usados na expedicao
- A logica de "Terceiro" para entregas permanece inalterada (input de texto livre)
- Nenhuma alteracao em banco de dados e necessaria

### Arquivos afetados
- `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx`
- `src/components/expedicao/AgendarCarregamentoModal.tsx`
- `src/components/expedicao/EditarOrdemCarregamentoDrawer.tsx`
