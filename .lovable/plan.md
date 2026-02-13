

# Sinalizar datas atrasadas em vermelho nos cards de Neo Instalacoes e Neo Correcoes

## Objetivo
Na etapa "Instalacoes e Correcoes" de `/direcao/gestao-fabrica`, datas de agendamento que ja passaram devem aparecer em vermelho para facilitar a identificacao visual de atrasos.

## Detalhes tecnicos

### Arquivos a editar

#### 1. `src/components/pedidos/NeoInstalacaoCardGestao.tsx`

Adicionar logica de verificacao de atraso e aplicar estilo vermelho:

- Criar helper `isAtrasado` que compara `data_instalacao` com a data atual
- **Modo lista (Col 8)**: Trocar a cor do label "Agendado" e da data de `text-blue-400` para `text-red-500` quando atrasado. Exibir "Atrasado" em vez de "Agendado".
- **Modo grid**: Aplicar `text-red-500` na data quando atrasada.

#### 2. `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

Mesma logica, usando `data_correcao`:

- Criar helper `isAtrasado` que compara `data_correcao` com a data atual
- **Modo lista (Col 8)**: Trocar a cor de `text-purple-400` para `text-red-500` quando atrasado. Exibir "Atrasado" em vez de "Agendado".
- **Modo grid**: Aplicar `text-red-500` na data quando atrasada.

### Logica de atraso (identica nos dois componentes)

```typescript
const atrasado = (() => {
  const dataStr = neoInstalacao.data_instalacao; // ou neoCorrecao.data_correcao
  if (!dataStr) return false;
  const data = new Date(dataStr + 'T12:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);
  return data < hoje;
})();
```

### Exemplo de alteracao no modo lista (Col 8)

```tsx
{/* Col 8: Data de Agendamento */}
<div className="text-center">
  {neoInstalacao.data_instalacao ? (
    <div className="flex flex-col items-center leading-tight">
      <span className={`text-[9px] font-medium ${atrasado ? 'text-red-500' : 'text-blue-400'}`}>
        {atrasado ? 'Atrasado' : 'Agendado'}
      </span>
      <span className={`text-xs font-bold ${atrasado ? 'text-red-500' : 'text-blue-400'}`}>
        {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yy")}
      </span>
    </div>
  ) : (
    <span className="text-[10px] font-bold text-destructive">
      Nao agendado
    </span>
  )}
</div>
```

### Arquivos editados
1. `src/components/pedidos/NeoInstalacaoCardGestao.tsx`
2. `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

