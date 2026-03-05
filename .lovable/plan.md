

# Adicionar modal de confirmação ao "Finalizar e Gerar Contas a Pagar"

## O que será feito

Adicionar um `AlertDialog` de confirmação antes de executar `handleFinalizar`. O botão passará a abrir o modal em vez de chamar a função diretamente.

## Mudanças em `src/pages/FolhaPagamentoNova.tsx`

1. **Importar** `AlertDialog` e seus subcomponentes de `@/components/ui/alert-dialog`
2. **Adicionar estado** `showConfirmDialog` (boolean, default false)
3. **Alterar o onClick do botão** de `handleFinalizar` para `() => setShowConfirmDialog(true)`
4. **Renderizar o AlertDialog** com:
   - Título: "Confirmar Finalização"
   - Descrição: "Tem certeza que deseja finalizar a folha de pagamento de [mês/ano] e gerar as contas a pagar? Esta ação não pode ser desfeita."
   - Botão "Cancelar" e botão "Sim, Finalizar" (que chama `handleFinalizar`)

