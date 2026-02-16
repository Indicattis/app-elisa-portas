

# Alterar tempo de faturamento para horario comercial

## Arquivo: `src/pages/administrativo/FaturamentoVendasMinimalista.tsx`

### 1. Atualizar imports (linha 38)
Remover `differenceInDays` e `differenceInHours` (nao serao mais usados) e adicionar import do `calcularTempoExpediente`.

### 2. Reescrever funcao `calcularTempoFaturamento` (linhas 380-397)
Substituir o calculo atual baseado em dias corridos por calculo usando `calcularTempoExpediente`, que conta apenas segundos dentro do horario 7h-17h de segunda a sexta.

A nova logica:
- Calcula segundos de expediente desde `data_venda` ate agora
- Converte para horas totais e depois em dias uteis (10h por dia)
- Formata como "Xh", "1 dia", "Xd Yh" ou "X dias"

Nenhum outro arquivo precisa ser alterado.

