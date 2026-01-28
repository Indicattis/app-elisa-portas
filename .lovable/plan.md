
## Plano: Padronizar Design dos Neo na Aba Finalizados

### Problema Identificado

Atualmente, os serviços avulsos (Neo Instalações e Neo Correções) na aba "Finalizados" usam um design simples inline diferente do design completo usado nas abas "Instalações" e "Correções".

**Design atual (Finalizados):**
- Layout simples com `flex` e poucos elementos
- Altura de 35px
- Apenas: bolinha colorida, nome, badge tipo, cidade/estado, tempo relativo, ícone check

**Design das outras abas:**
- Grid layout com 19 colunas (idêntico ao PedidoCard)
- Altura de 40px (h-10)
- Avatar do criador, nome completo, cidade/estado, data agendada, equipe responsável, badges, botões de ação

### Solução Proposta

Reutilizar os componentes `NeoInstalacaoCardGestao` e `NeoCorrecaoCardGestao` na aba "Finalizados", adaptando-os para:
1. Remover o botão "Concluir" (já estão concluídos)
2. Adicionar indicador visual de "Concluído" (ícone verde)
3. Mostrar tempo desde a conclusão

### Alterações Necessárias

#### 1. Modificar NeoInstalacaoCardGestao e NeoCorrecaoCardGestao

**Arquivos:** 
- `src/components/pedidos/NeoInstalacaoCardGestao.tsx`
- `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

Adicionar prop opcional `showConcluido` que:
- Quando true, remove o botão de concluir
- Mostra um badge/ícone indicando status "Concluído"
- Exibe o tempo desde a conclusão (se `concluida_em` existir)

```typescript
interface NeoInstalacaoCardGestaoProps {
  neoInstalacao: NeoInstalacao;
  viewMode?: 'grid' | 'list';
  onConcluir?: (id: string) => void;
  isConcluindo?: boolean;
  showConcluido?: boolean; // Nova prop
}
```

**Mudanças no layout list (Col 19):**

Quando `showConcluido=true`:
- Esconder botão de ação
- Mostrar ícone CheckCircle2 verde + tempo relativo

#### 2. Atualizar GestaoFabricaDirecao.tsx

**Arquivo:** `src/pages/direcao/GestaoFabricaDirecao.tsx`

Substituir o bloco inline atual na aba "Finalizados" pelo uso dos componentes:

```tsx
{etapaAtiva === 'finalizado' && (neoInstalacoesFinalizadas.length > 0 || neoCorrecoesFinalizadas.length > 0) && (
  <div className="mb-4 space-y-2">
    <h3>Serviços Avulsos Finalizados ({total})</h3>
    <div className="space-y-1">
      {/* Instalações finalizadas */}
      {neoInstalacoesFinalizadas.map((neo) => (
        <NeoInstalacaoCardGestao
          key={neo.id}
          neoInstalacao={neo}
          viewMode="list"
          showConcluido={true}
        />
      ))}
      {/* Correções finalizadas */}
      {neoCorrecoesFinalizadas.map((neo) => (
        <NeoCorrecaoCardGestao
          key={neo.id}
          neoCorrecao={neo}
          viewMode="list"
          showConcluido={true}
        />
      ))}
    </div>
  </div>
)}
```

---

### Detalhes Visuais

| Elemento | Instalações | Correções |
|----------|-------------|-----------|
| Cor do avatar | Azul | Roxo |
| Badge AVULSO | Azul | Roxo |
| Ícone tipo | Hammer (martelo) | AlertTriangle |
| Status concluído | CheckCircle2 verde | CheckCircle2 verde |

#### Indicador de Conclusão (Col 19)

Quando `showConcluido=true`, mostrar:
- Ícone CheckCircle2 em verde (h-4 w-4)
- Tempo relativo pequeno (ex: "há 2h")

---

### Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/pedidos/NeoInstalacaoCardGestao.tsx` | Adicionar prop `showConcluido` e lógica |
| `src/components/pedidos/NeoCorrecaoCardGestao.tsx` | Adicionar prop `showConcluido` e lógica |
| `src/pages/direcao/GestaoFabricaDirecao.tsx` | Usar componentes ao invés de renderização inline |

---

### Resultado Esperado

- Neo Instalações e Neo Correções finalizadas terão o mesmo design das abas Instalações e Correções
- Layout em grid de 19 colunas alinhado com PedidoCard
- Indicador visual claro de status "Concluído"
- Tempo desde conclusão visível
