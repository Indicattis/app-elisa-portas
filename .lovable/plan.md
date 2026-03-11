

## Plano: Adicionar seção "Observação da Venda" abaixo dos Produtos da Venda

### O que será feito

Adicionar um novo `Card` entre a seção "Produtos da Venda" (linha ~702) e "Medidas das Portas de Enrolar" (linha ~704) no arquivo `PedidoViewMinimalista.tsx`.

### Detalhes

O campo `observacoes_venda` já é buscado na query da venda (linha 192) e está disponível em `pedido.venda.observacoes_venda`. A seção só será exibida quando houver observação preenchida.

**Arquivo**: `src/pages/administrativo/PedidoViewMinimalista.tsx`

Após a linha 702 (fechamento do card de Produtos da Venda), inserir:

```tsx
{pedido.venda?.observacoes_venda && (
  <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2 text-white">
        <FileText className="w-4 h-4" />
        Observação da Venda
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-white/80 whitespace-pre-wrap bg-white/5 p-3 rounded-md">
        {pedido.venda.observacoes_venda}
      </p>
    </CardContent>
  </Card>
)}
```

O estilo segue o padrão visual já usado nas demais seções da página (cores, backdrop, borders).

