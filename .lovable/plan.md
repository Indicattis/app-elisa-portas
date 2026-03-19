

## Plano: Aplicar estilo MinimalistLayout em Pagamentos Autorizados

### Diferença atual

- **Frota** (`FrotaMinimalista.tsx`): Usa o componente `MinimalistLayout` que fornece breadcrumb animado, header com título/subtítulo/botão voltar/ações, e layout consistente com fundo escuro.
- **Pagamentos Autorizados** (`AcordosAutorizados.tsx`): Monta o layout manualmente com header, breadcrumb e filtros separados, sem usar `MinimalistLayout`.

### O que será feito

Refatorar `AcordosAutorizados.tsx` para usar o `MinimalistLayout`, alinhando o visual com a página de Frota.

**Arquivo: `src/pages/logistica/AcordosAutorizados.tsx`**

1. Substituir a estrutura manual (`min-h-screen bg-black`, header sticky, `AnimatedBreadcrumb`) pelo componente `MinimalistLayout`
2. Mover o botão "Novo Acordo" e os filtros (busca + status) para o `headerActions` do layout
3. Manter a tabela, dialogs e toda a lógica inalterados
4. Configurar breadcrumb: `Home > Logística > Pagamentos Autorizados`
5. Usar `backPath="/logistica"`, título "Pagamentos Autorizados", subtítulo "Gerencie acordos de instalação"

### Resultado

A página terá o mesmo padrão visual de header, breadcrumb e espaçamento que a Frota, com os filtros integrados no header.

