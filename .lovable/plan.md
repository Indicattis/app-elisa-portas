

## Plano: Abrir dialog com detalhes da conferência ao clicar

### Mudanças em `src/pages/logistica/FrotaConferenciasHistoricoMinimalista.tsx`

1. **Trocar o state** `selectedFoto` (string) por `selectedConferencia` (Conferencia | null)
2. **No onClick do card** de conferência, passar o objeto completo: `setSelectedConferencia(conferencia)`
3. **No Dialog**, exibir todas as informações da conferência:
   - Foto em destaque (grande, clicável para abrir em nova aba)
   - Status (badge)
   - Data/hora do registro
   - Km Atual
   - Água conferida (sim/não)
   - Nível óleo conferido (sim/não)
   - Data troca de óleo (se houver)
   - Observações (se houver)

O dialog mantém o estilo escuro/glassmorphism existente.

