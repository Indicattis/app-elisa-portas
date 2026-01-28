

## Plano: Downbar para Ordens de Carregamento/Instalacoes

### Objetivo
Atualizar o componente `OrdemCarregamentoDetails` para:
1. Usar downbar (bottom sheet) igual ao `PedidoDetalhesSheet`
2. Exibir endereco completo do cliente (cidade, estado, bairro, CEP)
3. Destacar produtos `porta_enrolar` com seus tamanhos
4. Mostrar cores das portas de forma visual

---

### Dados Disponiveis na Venda

A tabela `vendas` possui os seguintes campos de endereco:
- `cidade`
- `estado`
- `bairro`
- `cep`

Nao existem campos de rua/numero/complemento na tabela. Usaremos os campos disponiveis.

---

### Mudanca: Redesenhar OrdemCarregamentoDetails

**Arquivo:** `src/components/expedicao/OrdemCarregamentoDetails.tsx`

**Alteracoes:**

1. **Converter para downbar** - Mudar `side="right"` para `side="bottom"` com estilo glassmorphism escuro

2. **Header com gradiente** - Usar gradiente azul/roxo como no PedidoDetalhesSheet

3. **Secao de Endereco Completo** - Card dedicado com todos os campos disponiveis:
   - Cidade/Estado
   - Bairro
   - CEP

4. **Secao de Produtos porta_enrolar** - Filtrar e destacar apenas portas de enrolar:
   - Tamanho (largura x altura)
   - Badge com dimensoes
   - Cor visual (swatch + nome)

5. **Layout em cards** - Usar `bg-white/5 rounded-xl border border-white/10`

---

### Estrutura Proposta

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent 
    side="bottom" 
    className="h-[85vh] max-w-[700px] mx-auto rounded-t-2xl overflow-hidden flex flex-col p-0 bg-zinc-900 border-t border-white/10"
  >
    {/* Header com gradiente azul */}
    <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="flex items-center gap-2">
        <Badge>Entrega/Instalacao</Badge>
        <Badge>{status}</Badge>
      </div>
      <SheetTitle className="text-white">{nome_cliente}</SheetTitle>
    </div>

    {/* Conteudo scrollavel */}
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      
      {/* Card: Endereco Completo */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">
          Endereco de Entrega
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span className="text-white">{cidade} - {estado}</span>
          </div>
          {bairro && (
            <p className="text-sm text-white/70 pl-6">{bairro}</p>
          )}
          {cep && (
            <p className="text-sm text-white/50 pl-6">CEP: {cep}</p>
          )}
        </div>
      </div>

      {/* Card: Portas de Enrolar */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">
          Portas de Enrolar
        </h3>
        <div className="space-y-2">
          {produtos.filter(p => p.tipo_produto === 'porta_enrolar').map((produto, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
              {/* Swatch de cor */}
              {produto.cor && (
                <div 
                  className="h-8 w-8 rounded-lg border-2 border-white/20"
                  style={{ backgroundColor: produto.cor.codigo_hex }}
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-white">
                    {produto.largura}m x {produto.altura}m
                  </Badge>
                  {produto.quantidade > 1 && (
                    <span className="text-xs text-white/50">x{produto.quantidade}</span>
                  )}
                </div>
                {produto.cor && (
                  <p className="text-xs text-white/60 mt-1">{produto.cor.nome}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card: Informacoes de Carregamento */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3>Carregamento</h3>
        {/* Data, Hora, Responsavel */}
      </div>

      {/* Card: Informacoes do Pedido */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3>Pedido</h3>
        {/* Numero, Etapa */}
      </div>
    </div>
  </SheetContent>
</Sheet>
```

---

### Secao Tecnica

**Atualizacao do Hook**

O hook `useOrdensCarregamentoCalendario.ts` ja busca os dados necessarios:
- `venda.cidade`, `venda.estado`, `venda.cep`, `venda.bairro`
- `venda.produtos` com `tipo_produto`, `largura`, `altura`, `tamanho`, `cor`

Nenhuma alteracao no hook e necessaria.

**Filtragem de Produtos**

Para exibir apenas portas de enrolar:
```typescript
const portasEnrolar = ordem.venda?.produtos?.filter(
  p => p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'porta'
) || [];
```

**Formatacao de Tamanho**

```typescript
const formatTamanho = (produto) => {
  if (produto.tamanho) return produto.tamanho;
  if (produto.largura && produto.altura) {
    return `${produto.largura}m x ${produto.altura}m`;
  }
  return null;
};
```

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/expedicao/OrdemCarregamentoDetails.tsx` | Reestilizar para downbar com tema escuro, endereco completo e produtos filtrados |

---

### Resultado Visual

```text
+------------------------------------------+
|  [Entrega]  [Agendada]                   |  <- Header azul/roxo
|  GUSTAVO OLIVEIRA DE LIMA                |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | ENDERECO DE ENTREGA                |  |
|  | 📍 Guaiba - RS                     |  |
|  |    PEDRAS BRANCAS                  |  |
|  |    CEP: 92722-140                  |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | PORTAS DE ENROLAR                  |  |
|  | +--------------------------------+ |  |
|  | | [████] [6m x 4.8m]            | |  |  <- Swatch de cor
|  | |        Branco Neve             | |  |
|  | +--------------------------------+ |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | CARREGAMENTO                       |  |
|  | Data: 27/01/2026                   |  |
|  | Responsavel: HYUNDAI/HR HDB        |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | PEDIDO                             |  |
|  | Numero: #0117                      |  |
|  | Etapa: Finalizado                  |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

