

# Plano: Tooltip com Detalhes de Desconto em /direcao/vendas

## Visao Geral

Adicionar um tooltip informativo na coluna "Desconto" da tabela de vendas que exibe:
- Percentual de desconto aplicado
- Tipo de autorizacao (Responsavel do Setor ou Master)
- Nome de quem autorizou o desconto

## Analise Atual

### Estrutura de Dados

A tabela `vendas_autorizacoes_desconto` contem:

| Campo | Descricao |
|-------|-----------|
| `venda_id` | ID da venda vinculada |
| `autorizado_por` | UUID do usuario autorizador |
| `solicitado_por` | UUID do solicitante |
| `percentual_desconto` | % de desconto autorizado |
| `tipo_autorizacao` | `responsavel_setor` ou `master` |
| `senha_usada` | Qual senha foi usada |

### Query Atual

A query do `useVendas` nao inclui os dados de autorizacao:

```typescript
.select(`
  *,
  produtos:produtos_vendas(...),
  atendente:admin_users!atendente_id(...),
  notas_fiscais(...)
`)
```

---

## Solucao

### 1. Atualizar Query no `useVendas.ts`

Adicionar join com `vendas_autorizacoes_desconto` e buscar nome do autorizador:

```typescript
.select(`
  *,
  produtos:produtos_vendas(
    *,
    cor:catalogo_cores(nome, codigo_hex)
  ),
  atendente:admin_users!atendente_id(nome, foto_perfil_url),
  notas_fiscais(id, status, tipo),
  autorizacao_desconto:vendas_autorizacoes_desconto(
    id,
    percentual_desconto,
    tipo_autorizacao,
    autorizado_por,
    autorizador:admin_users!vendas_autorizacoes_desconto_autorizado_por_fkey(
      nome,
      foto_perfil_url
    )
  )
`)
```

### 2. Atualizar Componente `VendasDirecao.tsx`

#### 2.1. Importar componentes de Tooltip

```typescript
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
```

#### 2.2. Modificar a celula de desconto no `renderCell`

Transformar o case `'desconto'` para incluir um Tooltip quando houver desconto:

```typescript
case 'desconto':
  const desconto = calcularDescontoTotal();
  const autorizacao = venda.autorizacao_desconto?.[0];
  
  if (desconto <= 0) {
    return <span className="text-[10px] md:text-sm text-white/60">-</span>;
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-[10px] md:text-sm text-red-400 cursor-help underline decoration-dotted">
          -{formatCurrency(desconto)}
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-zinc-900 border-zinc-700 p-3 max-w-xs">
        <div className="space-y-2">
          <div className="text-sm font-medium text-white">
            Detalhes do Desconto
          </div>
          <div className="text-xs space-y-1">
            <p className="text-white/70">
              <span className="text-white/50">Valor:</span> {formatCurrency(desconto)}
            </p>
            {autorizacao && (
              <>
                <p className="text-white/70">
                  <span className="text-white/50">Percentual:</span>{' '}
                  {autorizacao.percentual_desconto.toFixed(2)}%
                </p>
                <p className="text-white/70">
                  <span className="text-white/50">Tipo:</span>{' '}
                  {autorizacao.tipo_autorizacao === 'master' 
                    ? 'Senha Master' 
                    : 'Responsavel do Setor'}
                </p>
                <p className="text-white/70">
                  <span className="text-white/50">Autorizado por:</span>{' '}
                  {autorizacao.autorizador?.nome || 'Nao informado'}
                </p>
              </>
            )}
            {!autorizacao && (
              <p className="text-white/50 italic">
                Sem autorizacao registrada
              </p>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
```

#### 2.3. Envolver a tabela com TooltipProvider

Garantir que a tabela esteja dentro de um `TooltipProvider`:

```typescript
<TooltipProvider delayDuration={200}>
  <Table>
    {/* ... conteudo da tabela */}
  </Table>
</TooltipProvider>
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useVendas.ts` | Adicionar join com `vendas_autorizacoes_desconto` e `admin_users` |
| `src/pages/direcao/VendasDirecao.tsx` | Importar Tooltip e modificar celula de desconto |

---

## Resultado Visual

Ao passar o mouse sobre o valor de desconto na tabela:

```
+----------------------------------+
|    Detalhes do Desconto          |
|----------------------------------|
| Valor: -R$ 500,00                |
| Percentual: 14.50%               |
| Tipo: Senha Master               |
| Autorizado por: Luan Pescador    |
+----------------------------------+
```

Para vendas sem autorizacao registrada (descontos dentro do limite automatico):

```
+----------------------------------+
|    Detalhes do Desconto          |
|----------------------------------|
| Valor: -R$ 100,00                |
| Sem autorizacao registrada       |
+----------------------------------+
```

