## Objetivo
Adicionar no header da página `/direcao/dre/:mes` um botão **"Imprimir PDF"** que gera um PDF para impressão contendo o demonstrativo de resultados (faturamento por categoria, lucro, margens, despesas fixas/folha/variáveis, projetadas, estoque e resumo final).

## Abordagem
Usar a estratégia nativa do navegador (`window.print()`) com CSS `@media print`. É a forma mais leve e fiel ao conteúdo já renderizado — sem dependências adicionais, e o usuário pode salvar como PDF direto no diálogo de impressão (recurso padrão de qualquer navegador moderno em `Ctrl+P` → "Salvar como PDF").

## Mudanças

### 1. `src/pages/direcao/DREMesDirecao.tsx`
- Importar ícone `Printer` de `lucide-react`.
- Adicionar prop `headerActions` no `<MinimalistLayout>` com um `<button>` "Imprimir PDF" que chama `window.print()`. Estilo glassmorphism consistente (bg-white/10, border-white/10, hover:bg-white/20, ícone + texto), exibido somente quando `!loading`.
- Envolver todo o conteúdo do DRE (a `<div className="space-y-6">` interna) numa `<div id="dre-print-area">` para servir de alvo do CSS de impressão.
- Adicionar um cabeçalho de impressão dentro de `#dre-print-area`, oculto na tela e visível apenas no PDF: título "Demonstrativo de Resultados", subtítulo com `mesNome`, e data de emissão (`format(new Date(), "dd/MM/yyyy 'às' HH:mm")`). Usa classes `hidden print:block`.
- Adicionar um bloco `<style>` (ou classes utilitárias) com regras `@media print`:
  - `body { background: white; color: black; }`
  - Esconder elementos não pertencentes ao DRE: `header (do layout), botão voltar, breadcrumb, headerActions (o próprio botão de imprimir), tooltips`. Implementação: marcar esses elementos do layout via classe `print:hidden` é inviável (o layout é compartilhado). Solução: usar regra global `@media print { body > div > *:not(#dre-print-area-wrapper) { display: none; } }` é frágil. **Melhor abordagem**: usar `@media print` para forçar exibir SOMENTE `#dre-print-area`:
    ```css
    @media print {
      body * { visibility: hidden; }
      #dre-print-area, #dre-print-area * { visibility: visible; }
      #dre-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; background: white; color: black; }
    }
    ```
  - Sobrescrever cores escuras dentro de `#dre-print-area` para impressão preto/branco: `color: black`, `background: white`, bordas `border-color: #ddd`, manter cores semânticas (verde/vermelho/amarelo) em tons mais escuros para legibilidade no papel (`text-emerald-400` → `color: #047857 !important` etc.) via CSS direcionado.
  - Desabilitar `sticky` e `overflow:hidden` para permitir paginação correta.
  - `@page { size: A4; margin: 12mm; }`
- O CSS `@media print` será adicionado num `<style>` inline ao final do componente (escopo global, ativa só na impressão) — abordagem simples e localizada na página.

### 2. (Opcional) Garantir que o tooltip de "Top 5" não atrapalhe
Os `TooltipContent` são renderizados em portal e ficam fora do `#dre-print-area`, então a regra `visibility: hidden` no `body *` já os esconde — comportamento correto.

## Comportamento esperado
1. Usuário acessa `/direcao/dre/2026-01`.
2. No canto direito do header aparece o botão **🖨 Imprimir PDF**.
3. Clique → abre o diálogo nativo de impressão do navegador com o DRE renderizado em fundo branco, texto preto, com cabeçalho "Demonstrativo de Resultados — Janeiro 2026", incluindo todas as tabelas (Faturamento/Lucro/Margem, Despesas Fixas, Folha Salarial, Despesas Variáveis, Projetadas do Ano, Estoque, Resumo Final).
4. Usuário pode imprimir ou "Salvar como PDF".

## Não incluso
- Geração server-side de PDF (jsPDF, pdfmake, edge function): desnecessário para o caso de uso e adicionaria peso. Caso o usuário prefira um PDF gerado programaticamente (sem passar pelo diálogo do navegador), informar e iremos para essa rota.

## Arquivos afetados
- `src/pages/direcao/DREMesDirecao.tsx` (única edição)
