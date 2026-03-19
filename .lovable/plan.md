

## Plano: Alinhar estilo de /administrativo/producao com /logistica/frota

### O que sera feito

Atualizar as classes CSS em `ProducaoAdminReadOnly.tsx` para usar o mesmo esquema de cores da pagina de Frota:

**Arquivo: `src/pages/administrativo/ProducaoAdminReadOnly.tsx`**

1. **Cards**: trocar `bg-primary/5 border-primary/10` por `bg-white/5 border-blue-500/10 backdrop-blur-xl`
2. **Tabs**: trocar `bg-primary/5 border-primary/10` por `bg-white/5 border-blue-500/10`
3. **Tab triggers**: trocar `data-[state=active]:bg-primary/10` por `data-[state=active]:bg-white/10`
4. **Badges/contadores**: trocar `bg-primary/10` por `bg-blue-500/20 text-blue-400`
5. **Input de busca**: trocar `bg-primary/5 border-primary/10` por `bg-white/5 border-blue-500/10`
6. **Table rows**: adicionar `border-blue-500/10 hover:bg-white/5`
7. **Select mobile**: mesmas trocas de cores
8. **Collapsible cards de itens**: mesmas trocas para manter consistencia

Apenas mudancas de classes CSS, sem alteracao de logica ou estrutura.

