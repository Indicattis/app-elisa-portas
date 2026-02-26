

# Adicionar secao de Informacoes de Pagamento acima das Parcelas

## O que sera feito

Inserir uma nova Card entre a tabela de produtos (linha ~734) e a secao "Parcelas / Contas a Receber" (linha ~736) exibindo os dados de pagamento da venda e o comprovante anexado.

## Mudancas

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

1. **Importar icones adicionais**: `FileText`, `Eye`, `Image` do lucide-react (para exibir o comprovante)

2. **Adicionar nova Card "Informacoes de Pagamento"** entre a tabela de produtos e a secao de parcelas, contendo:
   - **Metodo de pagamento**: exibe o metodo formatado (Boleto, Cartao, A Vista, Dinheiro) usando a mesma logica de labels ja existente na pagina
   - **Numero de parcelas**: se aplicavel (boleto/cartao)
   - **Intervalo entre boletos**: se metodo for boleto
   - **Comprovante anexado**: se `comprovante_url` existir, exibe o nome do arquivo com botao para visualizar (abre em nova aba). Se for imagem (png/jpg/webp), mostra preview. Se nao houver comprovante, exibe "Nenhum comprovante anexado"

3. **Layout**: grid de 2-3 colunas para os dados de pagamento, com o comprovante ocupando linha separada se existir. Estilo consistente com o tema escuro da pagina (bg-white/5, border-white/10, text-white)

## Secao visual esperada

```text
+--------------------------------------------------+
| Informacoes de Pagamento                         |
|                                                  |
| Metodo: Boleto    Parcelas: 3    Intervalo: 30d  |
|                                                  |
| Comprovante: [icone] arquivo.pdf  [Visualizar]   |
+--------------------------------------------------+
```

