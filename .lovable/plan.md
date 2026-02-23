
# Adicionar botao de Servicos na pagina Nova Venda

## Problema

A pagina `/vendas/minhas-vendas/nova` (VendaNovaMinimalista.tsx) nao tem o botao para adicionar servicos (manutencao). O formulario de produto (`ProdutoVendaForm`) ja suporta o tipo `manutencao` com opcoes como Manutencao, Instalacao Avulsa, Suporte Tecnico, Visita Tecnica, Reparo e Outro, mas nao ha botao para acessa-lo.

## Correcao em `src/pages/vendas/VendaNovaMinimalista.tsx`

### Adicionar botao "Servicos" na secao de produtos (apos o botao "Catalogo", linha ~634)

Adicionar um novo `ProductButton` com label "Servicos" que abre o formulario de produto com `tipoInicial='manutencao'`:

```typescript
<ProductButton 
  label="Serviços"
  onClick={() => {
    setProdutoEditando(undefined);
    setIndexEditando(undefined);
    setTipoInicial('manutencao');
    setPermitirTrocaTipo(false);
    setDialogOpen(true);
  }}
/>
```

## Resultado esperado

- Novo botao "Servicos" aparece ao lado dos botoes existentes (Porta de Enrolar, Porta Social, Pintura Eletrostatica, Catalogo)
- Ao clicar, abre o formulario de produto no modo manutencao com opcoes de tipo de servico, descricao e valor
- Nenhuma outra alteracao necessaria -- o formulario e a tabela de produtos ja suportam o tipo `manutencao`

## Arquivo modificado

1. `src/pages/vendas/VendaNovaMinimalista.tsx` -- adicionar ProductButton "Servicos"
