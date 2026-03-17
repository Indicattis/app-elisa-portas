

## Plano: Adicionar IP do usuário na tabela de cliques da Roleta WhatsApp

### Problema
A tabela `whatsapp_roulette_clicks` não possui coluna de IP. Os cliques provavelmente são inseridos por um sistema externo (site elisaportas.com), então precisamos:
1. Adicionar a coluna `ip` na tabela
2. Exibir na tabela de performance

**Nota:** A coluna será criada, mas o preenchimento do IP depende de o sistema que insere os cliques (provavelmente externo) passar esse dado. Cliques existentes aparecerão com "-".

### Mudanças

#### 1. Migration: adicionar coluna `ip` à tabela `whatsapp_roulette_clicks`
```sql
ALTER TABLE whatsapp_roulette_clicks ADD COLUMN ip text;
```

#### 2. `src/pages/marketing/PerformanceMinimalista.tsx`
- Adicionar `ip` à interface `WhatsAppClick` (linha 22-36)
- Adicionar coluna "IP" no `TableHeader` (após "Referrer", linha 1043)
- Adicionar `TableCell` com `click.ip || "-"` na renderização (após referrer, linha 1075-1077)

#### 3. `src/pages/Performance.tsx`
- Mesmas alterações de interface e tabela (se existir tabela similar)

### Observação
Se o sistema externo que registra os cliques não enviar o IP, a coluna ficará vazia. Será necessário atualizar o código do site/widget da roleta para capturar e enviar o IP do visitante no momento do insert.

