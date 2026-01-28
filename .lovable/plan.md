

## Plano: Adicionar Seção "Finalizados" para Neo Instalações e Neo Correções

### Problema Identificado

Quando uma Neo Instalação ou Neo Correção é concluída, ela desaparece da listagem sem aparecer em nenhum lugar. Isso ocorre porque:

1. O hook `useNeoInstalacoesListagem` filtra apenas registros com `concluida = false`
2. A página não possui uma seção para exibir os serviços avulsos finalizados

**Evidência no banco de dados:**
- Neo instalação "Espaço de Veiculos" foi concluída em 28/01/2026 às 19:06 mas não aparece em nenhuma seção

### Solução Proposta

Adicionar uma nova seção "Finalizados" na página `/logistica/instalacoes/ordens-instalacoes` que exibe as Neo Instalações e Neo Correções concluídas recentemente.

---

### Alterações Necessárias

#### 1. Criar hook para buscar Neo Instalações e Correções finalizadas

**Arquivo:** `src/hooks/useNeoInstalacoes.ts`

Adicionar nova função `useNeoInstalacoesFinalizadas`:

```typescript
export const useNeoInstalacoesFinalizadas = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ["neo_instalacoes_finalizadas"],
    queryFn: async () => {
      // Buscar neo instalações finalizadas (últimos 30 dias)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);
      
      const { data, error } = await supabase
        .from("neo_instalacoes")
        .select("*")
        .eq("concluida", true)
        .gte("concluida_em", dataLimite.toISOString())
        .order("concluida_em", { ascending: false });
      // ...
    },
  });
  return { neoInstalacoesFinalizadas: data, isLoading };
};
```

#### 2. Criar hook similar para Neo Correções

**Arquivo:** `src/hooks/useNeoCorrecoes.ts`

Adicionar `useNeoCorrecoesFinalizadas` com a mesma lógica.

#### 3. Atualizar a página de Ordens de Instalação

**Arquivo:** `src/pages/logistica/OrdensInstalacoesLogistica.tsx`

**Mudanças:**

| Item | Descrição |
|------|-----------|
| Importar novos hooks | `useNeoInstalacoesFinalizadas`, `useNeoCorrecoesFinalizadas` |
| Nova seção visual | Adicionar "Finalizados" após as correções avulsas |
| Ícone | `CheckCircle2` em verde |
| Contador | Mostrar total de finalizados recentes |

**Estrutura da nova seção:**

```tsx
{/* SEÇÃO 5: Finalizados (Neo) */}
<div className="space-y-3">
  <div className="flex items-center gap-2">
    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    <h2 className="text-lg font-semibold">Finalizados</h2>
    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600">
      {neoInstalacoesFinalizadas.length + neoCorrecoesFinalizadas.length}
    </Badge>
  </div>
  
  {/* Lista combinada de finalizados */}
  <div className="space-y-1">
    {[...neoInstalacoesFinalizadas, ...neoCorrecoesFinalizadas]
      .sort((a, b) => b.concluida_em - a.concluida_em)
      .map(item => (
        // Renderizar com badge indicando tipo (Instalação/Correção)
      ))
    }
  </div>
</div>
```

#### 4. Criar componentes de linha para itens finalizados

**Arquivos novos:**
- `src/components/instalacoes/NeoInstalacaoFinalizadaRow.tsx`
- `src/components/instalacoes/NeoCorrecaoFinalizadaRow.tsx`

Componentes simplificados mostrando:
- Nome do cliente
- Data de conclusão (formato relativo: "há 2 horas")
- Badge indicando tipo (Instalação Avulsa / Correção Avulsa)
- Quem concluiu (foto do usuário)

---

### Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useNeoInstalacoes.ts` | Adicionar `useNeoInstalacoesFinalizadas` |
| `src/hooks/useNeoCorrecoes.ts` | Adicionar `useNeoCorrecoesFinalizadas` |
| `src/pages/logistica/OrdensInstalacoesLogistica.tsx` | Adicionar seção "Finalizados" |
| `src/components/instalacoes/NeoInstalacaoFinalizadaRow.tsx` | **Criar** componente |
| `src/components/instalacoes/NeoCorrecaoFinalizadaRow.tsx` | **Criar** componente |

---

### Resultado Esperado

- Neo Instalações e Neo Correções concluídas aparecem na seção "Finalizados"
- Listagem mostra os últimos 30 dias de serviços concluídos
- Visual consistente com as demais seções da página
- Data de conclusão formatada de forma legível
- Usuário pode ver quem concluiu cada serviço

