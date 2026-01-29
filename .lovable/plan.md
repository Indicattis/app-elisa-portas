
# Plano: Input Condicional de Meta + Caixa Flutuante de Progresso

## Objetivo

1. **Formulário de Meta Condicional**: Alterar o input de valor da meta para mostrar campos específicos por tipo (ex: metragem linear para perfiladeira, m² para pintura)
2. **Caixa Flutuante de Progresso**: Exibir notificação flutuante nas páginas de produção quando uma ordem é concluída, mostrando o avanço da meta do colaborador

---

## Parte 1: Input Condicional no MetaDialog

### Alterações em `src/components/metas/MetaDialog.tsx`

Modificar o campo de "Valor da Meta" para renderizar inputs diferentes baseado no tipo selecionado:

| Tipo | Input | Placeholder | Sufixo |
|------|-------|-------------|--------|
| **Solda** | Número inteiro | "Ex: 50" | portas |
| **Perfiladeira** | Decimal | "Ex: 150,5" | metros |
| **Separação** | Número inteiro | "Ex: 200" | itens |
| **Qualidade** | Número inteiro | "Ex: 30" | pedidos |
| **Pintura** | Decimal | "Ex: 85,5" | m² |
| **Carregamento** | Número inteiro | "Ex: 25" | pedidos |

### Código do Input Condicional

```tsx
const getInputConfig = (tipo: string) => {
  switch (tipo) {
    case "solda":
      return { placeholder: "Ex: 50", sufixo: "portas", step: "1" };
    case "perfiladeira":
      return { placeholder: "Ex: 150,5", sufixo: "metros", step: "0.1" };
    case "separacao":
      return { placeholder: "Ex: 200", sufixo: "itens", step: "1" };
    case "qualidade":
      return { placeholder: "Ex: 30", sufixo: "pedidos", step: "1" };
    case "pintura":
      return { placeholder: "Ex: 85,5", sufixo: "m²", step: "0.1" };
    case "carregamento":
      return { placeholder: "Ex: 25", sufixo: "pedidos", step: "1" };
    default:
      return { placeholder: "Ex: 100", sufixo: "", step: "1" };
  }
};

// No JSX:
<div className="space-y-2">
  <Label>Valor da Meta *</Label>
  <div className="flex items-center gap-2">
    <Input
      type="number"
      step={inputConfig.step}
      placeholder={inputConfig.placeholder}
      value={valorMeta}
      onChange={(e) => setValorMeta(e.target.value)}
      className="flex-1"
    />
    <span className="text-sm text-muted-foreground whitespace-nowrap">
      {inputConfig.sufixo}
    </span>
  </div>
  <p className="text-xs text-muted-foreground">
    {getUnidadeDescricao(tipoMeta)}
  </p>
</div>
```

---

## Parte 2: Caixa Flutuante de Progresso de Meta

### Novo Componente: `src/components/metas/MetaProgressoFlutuante.tsx`

Componente flutuante que aparece no canto inferior da tela quando uma ordem é concluída, mostrando o progresso da meta ativa do colaborador.

```text
┌─────────────────────────────────────────────┐
│  🎯 Meta de Solda                           │
│  ████████████░░░░░░░░░░░░░░░░  35/100       │
│  ────────────────────────────────           │
│  35% concluído                              │
│  R$ 150,00 • Termina em 28/02               │
└─────────────────────────────────────────────┘
```

### Funcionalidades do Componente

1. **Aparecer automaticamente** quando uma ordem é concluída
2. **Buscar a meta ativa** do colaborador para o tipo da ordem concluída
3. **Calcular progresso atual** buscando desempenho no período da meta
4. **Auto-fechar** após 5 segundos (ou ao clicar)
5. **Animação de entrada/saída** suave

### Hook: `src/hooks/useMetaProgresso.ts`

Hook para buscar meta ativa e calcular progresso quando ordem é concluída:

```tsx
export function useMetaProgresso() {
  const [metaInfo, setMetaInfo] = useState<MetaProgressoInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const mostrarProgresso = async (userId: string, tipoOrdem: TipoOrdem) => {
    // 1. Buscar meta ativa do tipo
    const meta = await buscarMetaAtiva(userId, tipoOrdem);
    if (!meta) return;

    // 2. Calcular progresso atual
    const progresso = await calcularProgresso(userId, tipoOrdem, meta);

    // 3. Mostrar componente
    setMetaInfo({ meta, progressoAtual: progresso });
    setVisible(true);

    // 4. Auto-fechar após 5s
    setTimeout(() => setVisible(false), 5000);
  };

  return { metaInfo, visible, mostrarProgresso, fechar: () => setVisible(false) };
}
```

### Integração nas Páginas de Produção

Adicionar o componente flutuante em todas as páginas de produção (Solda, Perfiladeira, Separação, Qualidade, Pintura, Carregamento):

```tsx
// Em cada página de produção (ex: SoldaMinimalista.tsx)
import { MetaProgressoFlutuante } from "@/components/metas/MetaProgressoFlutuante";
import { useMetaProgresso } from "@/hooks/useMetaProgresso";

// No componente:
const { metaInfo, visible, mostrarProgresso, fechar } = useMetaProgresso();

// Ao concluir ordem:
const handleConcluirOrdem = async (ordemId: string) => {
  await concluirOrdem.mutateAsync(ordemId);
  setSheetOpen(false);
  
  // Mostrar progresso da meta
  if (user?.id) {
    mostrarProgresso(user.id, 'soldagem');
  }
};

// No JSX:
<MetaProgressoFlutuante
  metaInfo={metaInfo}
  visible={visible}
  onClose={fechar}
/>
```

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/metas/MetaDialog.tsx` | Editar | Input condicional por tipo de meta |
| `src/components/metas/MetaProgressoFlutuante.tsx` | **Criar** | Componente flutuante de progresso |
| `src/hooks/useMetaProgresso.ts` | **Criar** | Hook para buscar meta e calcular progresso |
| `src/pages/fabrica/producao/SoldaMinimalista.tsx` | Editar | Integrar caixa flutuante |
| `src/pages/fabrica/producao/PerfiladeiraMinimalista.tsx` | Editar | Integrar caixa flutuante |
| `src/pages/fabrica/producao/SeparacaoMinimalista.tsx` | Editar | Integrar caixa flutuante |
| `src/pages/fabrica/producao/QualidadeMinimalista.tsx` | Editar | Integrar caixa flutuante |
| `src/pages/fabrica/producao/PinturaMinimalista.tsx` | Editar | Integrar caixa flutuante |
| `src/pages/fabrica/producao/CarregamentoMinimalista.tsx` | Editar | Integrar caixa flutuante |
| `src/pages/ProducaoSolda.tsx` | Editar | Integrar caixa flutuante (versão desktop) |
| `src/pages/ProducaoPerfiladeira.tsx` | Editar | Integrar caixa flutuante (versão desktop) |
| `src/pages/ProducaoSeparacao.tsx` | Editar | Integrar caixa flutuante (versão desktop) |
| `src/pages/ProducaoQualidade.tsx` | Editar | Integrar caixa flutuante (versão desktop) |
| `src/pages/ProducaoPintura.tsx` | Editar | Integrar caixa flutuante (versão desktop) |

---

## Design do Componente Flutuante

### Estrutura Visual

```text
┌──────────────────────────────────────────────────────┐
│ [X]                                                  │
│  🔥 Meta de Solda                                   │
│                                                      │
│  ████████████████████░░░░░░░░░░  67/100 portas      │
│                                                      │
│  67% concluído                                       │
│                                                      │
│  💰 R$ 150,00    📅 01/02 - 28/02                   │
└──────────────────────────────────────────────────────┘
```

### Posicionamento

- **Posição**: Canto inferior direito (`fixed bottom-4 right-4`)
- **Z-index**: Alto para ficar acima de outros elementos (`z-50`)
- **Largura**: Máxima de 320px (`max-w-xs`)
- **Animação**: Slide-in da direita + fade

### Cores por Tipo de Meta

| Tipo | Cor de Destaque |
|------|-----------------|
| Solda | Laranja (orange-500) |
| Perfiladeira | Azul (blue-500) |
| Separação | Roxo (purple-500) |
| Qualidade | Verde (green-500) |
| Pintura | Rosa (pink-500) |
| Carregamento | Âmbar (amber-500) |

---

## Lógica de Cálculo de Progresso

### Mapeamento de Tipo de Ordem para Meta

| Tipo Ordem | Tipo Meta | Métrica |
|------------|-----------|---------|
| `soldagem` | `solda` | Soma de `qtd_portas_p + qtd_portas_g` das ordens concluídas |
| `perfiladeira` | `perfiladeira` | Soma de `metragem_linear` das ordens concluídas |
| `separacao` | `separacao` | Soma de `quantidade_itens` das ordens concluídas |
| `qualidade` | `qualidade` | Contagem de pedidos inspecionados |
| `pintura` | `pintura` | Soma de `metragem_quadrada` das ordens concluídas |
| `carregamento` | `carregamento` | Contagem de pedidos carregados |

### Query de Progresso (exemplo para Solda)

```sql
SELECT COALESCE(SUM(qtd_portas_p + qtd_portas_g), 0) as total
FROM ordens_soldagem
WHERE responsavel_id = :userId
  AND status = 'concluido'
  AND data_conclusao >= :dataInicioMeta
  AND data_conclusao <= :dataTerminoMeta;
```

---

## Resumo

| Item | Tipo | Descrição |
|------|------|-----------|
| Input condicional | UX | Placeholders e sufixos específicos por tipo |
| Caixa flutuante | Novo componente | Mostra progresso ao concluir ordem |
| Hook de progresso | Novo hook | Busca meta ativa e calcula progresso |
| Integração | 12 páginas | Todas páginas de produção (minimalistas + desktop) |

---

## Resultado Esperado

1. Ao criar meta, o input mostra placeholder e unidade específica do tipo
2. Ao concluir uma ordem na produção, aparece uma caixa flutuante com:
   - Tipo da meta e ícone colorido
   - Barra de progresso atualizada
   - Valor atual / valor da meta
   - Recompensa em R$
   - Período de vigência
3. A caixa fecha automaticamente após 5 segundos ou ao clicar no X
