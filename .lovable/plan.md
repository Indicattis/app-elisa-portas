

# Correção: Lucro de portas R$ 0,00 e verificação do faturamento

## Diagnóstico

### 1. Lucro portas = R$ 0,00 (Bug confirmado)
Consultei o banco e confirmei: `lucro_produto` e `lucro_pintura` são **sempre 0** para todos os tipos de produto. O lucro real está em `lucro_item`.

```text
porta_enrolar:  lucro_item = R$ 167.441,19 | lucro_produto = R$ 0,00 | lucro_pintura = R$ 0,00
pintura_epoxi:  lucro_item = R$  28.785,32 | lucro_produto = R$ 0,00 | lucro_pintura = R$ 0,00
acessorio:      lucro_item = R$   9.104,70 | lucro_produto = R$ 0,00 | lucro_pintura = R$ 0,00
```

O código na linha 383 usa `p.lucro_produto` (sempre 0) em vez de `p.lucro_item`.

### 2. Faturamento total
Verifiquei no banco: `SUM(valor_total_sem_frete) = R$ 1.118.842,91` + `SUM(valor_credito) = R$ 16.387,00` = **R$ 1.135.229,91**. A lógica de cálculo proporcional no código preserva esse total matematicamente. Se o valor ainda aparece errado, pode ser cache do navegador — a correção do lucro vai forçar um novo deploy.

## Correção em `DREMesDirecao.tsx`

**Linha 383-384** — Substituir `lucro_produto`/`lucro_pintura` por `lucro_item` para portas:

```typescript
// ANTES (errado - lucro_produto é sempre 0)
luc.portas += p.lucro_produto || 0;
luc.pintura += p.lucro_pintura || 0;

// DEPOIS (correto - usar lucro_item)
luc.portas += p.lucro_item || 0;
// Não adicionar lucro_pintura separado para portas (já está incluído em lucro_item)
```

Para `pintura_epoxi` standalone (linha 387), o código já usa `p.lucro_item` — correto.

## Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx` (linhas 383-384)

