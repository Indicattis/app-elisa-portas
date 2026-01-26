

## Plano: Corrigir Cor do Produto Pintura Epoxi

### Situacao Atual

Na venda `589b2296-6585-463d-9edc-5870a837ea84`, o produto de pintura eletrostatica esta cadastrado com a cor errada:

| Campo | Valor Atual | Valor Correto |
|-------|-------------|---------------|
| Cor | Vermelho | Preto Fosco |
| Cor ID | `826e51d7-0b2b-4a60-9495-3aa1c9bfcb97` | `7d856cba-536d-440b-9114-3076cb9a8e76` |
| Codigo Hex | `#b80000` | `#14181e` |
| Descricao | Pintura Vermelho | Pintura Preto Fosco |

---

### Correcao Necessaria

Executar uma migration SQL para atualizar o registro do produto:

```sql
UPDATE produtos_vendas
SET 
  cor_id = '7d856cba-536d-440b-9114-3076cb9a8e76',
  descricao = 'Pintura Preto Fosco'
WHERE id = 'a26f7649-08fb-49e4-a154-0294759f1984'
  AND venda_id = '589b2296-6585-463d-9edc-5870a837ea84'
  AND tipo_produto = 'pintura_epoxi';
```

---

### Dados Envolvidos

**Produto a ser atualizado:**
- ID: `a26f7649-08fb-49e4-a154-0294759f1984`
- Tipo: `pintura_epoxi`
- Tamanho: 2.52 x 2.6m
- Valor: R$ 800,00

**Nova cor:**
- Nome: Preto Fosco
- ID: `7d856cba-536d-440b-9114-3076cb9a8e76`
- Codigo Hex: #14181e

---

### Resultado Esperado

Apos a correcao, ao visualizar a venda em `/direcao/vendas/589b2296-6585-463d-9edc-5870a837ea84`:

1. O produto de pintura exibira a cor **Preto Fosco** em vez de Vermelho
2. O badge de cor mostrara a cor preta (#14181e)
3. A descricao do produto sera "Pintura Preto Fosco"

