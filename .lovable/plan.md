

# Adicionar "Qtd Meia Cana" como Eixo de Calculo

## Resumo

Adicionar uma terceira opcao ao seletor de "Eixo" no calculo automatico de quantidade: **"Qtd Meia Cana"**. Quando selecionada, o valor base usado no calculo sera `Math.ceil(altura / 0.076)` em vez de usar diretamente a largura ou altura da porta.

Isso permite criar calculos compostos, por exemplo: `Math.ceil(altura / 0.076) * 2` para obter o dobro da quantidade de meia canas.

## Alteracoes

### 1. Formulario de edicao (`src/pages/administrativo/EstoqueEditMinimalista.tsx`)

- Adicionar `<SelectItem value="qtd_meia_cana">Qtd Meia Cana</SelectItem>` no seletor de Eixo
- Atualizar o texto da formula para exibir "Qtd Meia Cana (⌈Altura÷0.076⌉)" quando esse eixo for selecionado
- Atualizar o type cast na linha 133 para incluir `'qtd_meia_cana'`

### 2. Logica de calculo no modal (`src/components/pedidos/AdicionarLinhaModal.tsx`)

Na funcao `calcularQuantidadeAutomatica`, alterar a resolucao do eixo:

```text
Se qtd_eixo_calculo === 'largura'  -> eixoValor = portaLargura
Se qtd_eixo_calculo === 'altura'   -> eixoValor = portaAltura
Se qtd_eixo_calculo === 'qtd_meia_cana' -> eixoValor = Math.ceil(portaAltura / 0.076)
```

### 3. Logica de calculo nos itens padrao (`src/components/pedidos/LinhasAgrupadasPorPorta.tsx`)

Mesma alteracao na funcao `calcularQuantidadeAutomaticaItem`.

### 4. Tipos (`src/hooks/useEstoque.ts`)

Atualizar o tipo de `qtd_eixo_calculo` para incluir `'qtd_meia_cana'`.

### Arquivos modificados

1. `src/pages/administrativo/EstoqueEditMinimalista.tsx` - nova opcao no select + formula
2. `src/components/pedidos/AdicionarLinhaModal.tsx` - logica de calculo
3. `src/components/pedidos/LinhasAgrupadasPorPorta.tsx` - logica de calculo
4. `src/hooks/useEstoque.ts` - tipo

