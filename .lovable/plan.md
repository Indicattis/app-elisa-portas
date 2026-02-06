
# Plano: Modal de Desempenho do Colaborador no Ranking

## O que muda

Ao clicar em um colaborador no ranking (componente PortasPorEtapa dentro de `/direcao/gestao-fabrica`), em vez de navegar para outra pagina, abrira um **modal/dialog** com:

1. **Desempenho da semana** - graficos de desempenho diario do colaborador na semana atual
2. **Metas existentes** - lista das metas definidas com progresso
3. **Botao "Nova Meta"** - para criar uma meta diretamente do modal

---

## Detalhes Tecnicos

### 1. Novo componente: `src/components/producao/ColaboradorDesempenhoModal.tsx`

Um Dialog que recebe `userId` e `open/onOpenChange`, contendo:

- **Header**: Avatar, nome do colaborador e periodo (semana atual)
- **Secao "Desempenho Semanal"**: Reutiliza o componente `GraficoDesempenhoDiario` com dados da semana (segunda a hoje), usando o hook `useDesempenhoDiarioColaborador`
- **Secao "Metas"**: Lista de metas usando o componente `MetaCard` existente, com hook `useMetasColaborador` e `useMetaProgressoCalculado`
- **Botao "Nova Meta"**: Abre o `MetaDialog` existente passando o `userId`
- **Botao "Editar/Excluir Meta"**: Reusa a mesma logica do `MetasColaboradorIndividual`

Hooks reutilizados (ja existem):
- `useColaboradorInfo(userId)` - info do colaborador
- `useDesempenhoDiarioColaborador(userId, dataInicio, dataFim)` - desempenho diario
- `useMetasColaborador(userId)` - metas do colaborador
- `useMetaProgressoCalculado(userId, metas)` - progresso das metas

Componentes reutilizados (ja existem):
- `GraficoDesempenhoDiario` - graficos de barras por tipo
- `MetaCard` - card de meta com progresso
- `MetaDialog` - dialog de criar/editar meta

### 2. Alterar: `src/components/producao/dashboard/PortasPorEtapa.tsx`

- Adicionar estado `selectedColaboradorId` e `modalOpen`
- Alterar `handleColaboradorClick` para abrir o modal em vez de navegar:

```tsx
const [selectedColaboradorId, setSelectedColaboradorId] = useState<string | null>(null);

const handleColaboradorClick = (userId: string) => {
  setSelectedColaboradorId(userId);
};
```

- Renderizar o `ColaboradorDesempenhoModal` no final do componente:

```tsx
<ColaboradorDesempenhoModal
  userId={selectedColaboradorId}
  open={!!selectedColaboradorId}
  onOpenChange={(open) => { if (!open) setSelectedColaboradorId(null); }}
/>
```

### 3. Estrutura do Modal

```text
+------------------------------------------+
| [Avatar] Nome do Colaborador        [X]  |
| Semana: 03/02 - 07/02/2026              |
+------------------------------------------+
| Desempenho Semanal                       |
| [Grafico Solda] [Grafico Perfiladeira]   |
| [Grafico Separacao] [Grafico Qualidade]  |
| [Grafico Pintura] [Grafico Expedicao]    |
+------------------------------------------+
| Metas                    [+ Nova Meta]   |
| [MetaCard 1] [MetaCard 2]               |
| ou "Nenhuma meta definida"               |
+------------------------------------------+
```

O modal usara `sm:max-w-3xl` para ter espaco suficiente para os graficos lado a lado. Sera scrollavel internamente para acomodar todo o conteudo.

### Arquivos modificados/criados

1. **Criar**: `src/components/producao/ColaboradorDesempenhoModal.tsx`
2. **Modificar**: `src/components/producao/dashboard/PortasPorEtapa.tsx` (trocar navegacao por abertura de modal)
