
# Plano: Adicionar Data de Criação da Venda Personalizável

## Contexto

Atualmente, a página `/vendas/minhas-vendas/nova` define automaticamente a data da venda como a data atual (`new Date().toISOString()`) no momento da criação. O usuário deseja poder cadastrar vendas com datas passadas.

## Alterações Necessárias

### Arquivo: `src/pages/vendas/VendaNovaMinimalista.tsx`

**1. Adicionar estado para a data da venda (próximo à linha 48):**

```typescript
const [dataVenda, setDataVenda] = useState<Date>(new Date());
```

**2. Adicionar campo de Data da Venda na seção "Dados Adicionais" (após o campo de Frete, antes de Previsão de Entrega):**

```typescript
<div className="space-y-2">
  <Label className={labelClass}>Data da Venda *</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          inputClass
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-blue-400/60" />
        {format(dataVenda, "dd/MM/yyyy", { locale: ptBR })}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0 bg-zinc-900 border-blue-500/20" align="start">
      <Calendar
        mode="single"
        selected={dataVenda}
        onSelect={(date) => date && setDataVenda(date)}
        disabled={(date) => date > new Date()}
        initialFocus
        className="pointer-events-auto"
      />
    </PopoverContent>
  </Popover>
</div>
```

**3. Atualizar as chamadas de createVenda para usar a data selecionada (linhas 441 e 470):**

De:
```typescript
data_venda: new Date().toISOString(),
```

Para:
```typescript
data_venda: dataVenda.toISOString(),
```

## Comportamento

| Aspecto | Valor |
|---------|-------|
| Valor padrão | Data atual |
| Datas permitidas | Passadas e hoje (futuras bloqueadas) |
| Campo obrigatório | Sim (sempre tem valor) |
| Posição no formulário | Seção "Dados Adicionais", após Frete |

## Resultado Esperado

- Usuário pode selecionar qualquer data passada ou a data atual
- Datas futuras ficam desabilitadas no calendário
- O campo inicia com a data de hoje por padrão
- Layout consistente com o campo de "Previsão de Entrega" existente
