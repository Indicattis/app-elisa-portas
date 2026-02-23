

# Downbar de detalhamento por indicador no Faturamento

## Objetivo

Ao clicar em qualquer um dos 5 indicadores (Portas, Pintura, Instalacoes, Acessorios, Adicionais), abrir uma downbar (Drawer bottom) com uma listagem ranking do que mais saiu naquela categoria. Funciona tanto em desktop quanto em mobile.

## Dados de cada indicador (calculados a partir de `filteredVendas` ja em memoria)

- **Portas**: Agrupar por `tamanho` (campo do `produtos_vendas`), contar quantidade e somar valor. Ranking por quantidade.
- **Pintura**: Agrupar por `cor_id` -- buscar nome da cor da tabela `catalogo_cores`. Ranking por quantidade.
- **Instalacoes**: Agrupar por `cidade` da tabela `vendas` (filtrar vendas com `valor_instalacao > 0`). Ranking por quantidade.
- **Acessorios**: Agrupar por `acessorio_id` -- buscar nome da tabela `acessorios`. Ranking por quantidade.
- **Adicionais**: Agrupar por `adicional_id` ou `descricao` -- buscar nome da tabela `adicionais`. Ranking por quantidade.

## Mudancas

### 1. `src/components/direcao/IndicadorExpandivel.tsx`

Adicionar prop `onClick` opcional e tornar o card clicavel quando fornecido:

```typescript
interface IndicadorExpandivelProps {
  // ... props existentes
  onClick?: () => void;
}
```

Aplicar `cursor-pointer hover:bg-white/10 transition-colors` quando `onClick` estiver presente.

### 2. `src/pages/direcao/FaturamentoDirecao.tsx`

#### 2a. Novo estado para a downbar de indicadores

```typescript
const [indicadorDrawerOpen, setIndicadorDrawerOpen] = useState(false);
const [indicadorAtivo, setIndicadorAtivo] = useState<string | null>(null);
```

#### 2b. Buscar dados auxiliares (cores, acessorios, adicionais)

Adicionar um `useEffect` para buscar as tabelas auxiliares necessarias para os nomes:
- `catalogo_cores` (id, nome, codigo_hex)
- `acessorios` (id, nome)
- `adicionais` (id, nome)

Armazenar em estados `Map` para lookup rapido.

#### 2c. Funcao `useMemo` para calcular rankings

Criar um `useMemo` que, para cada tipo de indicador, percorre `filteredVendas` e agrupa os dados:

- **Portas**: percorre `produtos_vendas` com tipo `porta_enrolar`/`porta_social`, agrupa por `tamanho` (ou `largura x altura`), soma quantidade e valor.
- **Pintura**: percorre `produtos_vendas` com tipo `pintura_epoxi`, agrupa por `cor_id`, busca nome no map de cores.
- **Instalacoes**: percorre vendas com `valor_instalacao > 0`, agrupa por `cidade`.
- **Acessorios**: percorre `produtos_vendas` com tipo `acessorio`, agrupa por `acessorio_id`, busca nome no map.
- **Adicionais**: percorre `produtos_vendas` com tipo `adicional`/`manutencao`, agrupa por `adicional_id` ou `descricao`.

Cada item do ranking tera: `nome`, `quantidade`, `valor_total`.

#### 2d. Adicionar `onClick` nos indicadores

Nos 5 indicadores (portas, pintura, instalacoes, acessorios, adicionais), adicionar:

```typescript
onClick={() => {
  setIndicadorAtivo('portas'); // ou 'pintura', etc.
  setIndicadorDrawerOpen(true);
}}
```

Os indicadores "Fretes", "Lucro Liquido" e "Qtd Portas" nao terao onClick.

#### 2e. Adicionar Drawer no JSX

Adicionar um novo `Drawer` (apos o mobile downbar existente) que renderiza o ranking:

```typescript
<Drawer open={indicadorDrawerOpen} onOpenChange={setIndicadorDrawerOpen}>
  <DrawerContent className="max-h-[85vh] bg-zinc-900 border-t border-white/10">
    <div className="mx-auto w-full max-w-lg">
      {/* Header com icone e titulo */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {icone do indicador ativo}
        <h3 className="text-white font-semibold">Ranking - {titulo}</h3>
      </div>
      <ScrollArea className="h-[65vh] px-4 pb-4">
        {/* Lista de itens do ranking */}
        {rankingData.map((item, index) => (
          <div key={item.nome} className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-white/30 text-sm w-6">{index + 1}.</span>
              <span className="text-white text-sm">{item.nome}</span>
            </div>
            <div className="text-right">
              <p className="text-white text-sm font-medium">{item.quantidade}x</p>
              <p className="text-white/50 text-xs">{formatCurrency(item.valor_total)}</p>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  </DrawerContent>
</Drawer>
```

Este Drawer aparece em todas as resolucoes (sem condicional `isMobile`).

## Arquivos modificados

1. `src/components/direcao/IndicadorExpandivel.tsx` -- adicionar prop `onClick`
2. `src/pages/direcao/FaturamentoDirecao.tsx` -- estados, busca auxiliar, rankings, onClick nos indicadores, Drawer

## Resultado

Ao clicar em qualquer indicador (Portas, Pintura, Instalacoes, Acessorios, Adicionais), abre uma downbar de baixo com o ranking dos itens mais vendidos naquela categoria, mostrando posicao, nome, quantidade e valor total. Estilo minimalista dark consistente com o restante do sistema.
