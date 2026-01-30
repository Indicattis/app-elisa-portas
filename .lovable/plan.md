
# Plano: Corrigir Regras de Quebra de Etiquetas para Pintura

## Problema Identificado

As etiquetas de "Meia Cana Lisa" estão sendo impressas com quantidade errada (5 em 5) quando deveriam ser 10 em 10 para portas pequenas.

### Análise do Banco de Dados

As regras cadastradas para o produto "Meia Cana Lisa" estão com os **divisores invertidos**:

| Regra Atual | Condição | Divisor | Deveria Ser |
|-------------|----------|---------|-------------|
| "Meia Cana 0,70 maior que 6,5m" | largura > 6.5m | 10 | **5** |
| "Meia Cana 0,70 menor que 6,5m" | largura < 6.5m | 5 | **10** |

**Lógica correta (conforme informado)**:
- Porta **pequena** (< 6,5m): quebra de **10 em 10**
- Porta **grande** (> 6,5m): quebra de **5 em 5**

---

## Solução

A correção envolve **atualizar as regras no banco de dados** para inverter os divisores.

### Opção 1: Atualização via Interface (Recomendado)

1. Acessar `/administrativo/compras/estoque/editar-item/d9d2982d-1323-4f04-9783-7bd3e7eca88c`
2. Na seção de regras de etiquetas:
   - Regra "maior que 6,5m" → alterar divisor para **5**
   - Regra "menor que 6,5m" → alterar divisor para **10**
3. Salvar as alterações

### Opção 2: Atualização via SQL (Alternativa)

Executar no SQL Editor do Supabase:

```sql
-- Corrigir regra para porta GRANDE (> 6.5m): divisor = 5
UPDATE regras_etiquetas 
SET divisor = 5
WHERE id = '9a15ac7e-2f07-475d-9116-9930f370d3b3';

-- Corrigir regra para porta PEQUENA (< 6.5m): divisor = 10
UPDATE regras_etiquetas 
SET divisor = 10
WHERE id = '49178130-f516-42f5-b645-039fb2286f08';
```

---

## Problema Secundário: Largura Nula

Algumas linhas de pintura não têm a largura preenchida (`largura: null`). Quando isso acontece:
- O sistema usa `largura = 0`
- Como `0 < 6.5`, aplica a regra de "menor que 6.5m"
- Com a correção acima, isso resultará em divisor 10 (correto para portas pequenas)

Se precisar que portas sem dimensão definida usem um divisor padrão diferente, será necessário criar uma regra adicional sem condição de dimensão.

---

## Resumo

| Ação | Local |
|------|-------|
| Corrigir divisores das regras | Interface de edição do produto ou SQL |

## Resultado Esperado

Após a correção:
- Portas pequenas (< 6,5m): etiquetas de **10 em 10**
- Portas grandes (> 6,5m): etiquetas de **5 em 5**
