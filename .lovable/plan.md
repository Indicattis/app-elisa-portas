

## Plano: Destacar botões dos controladores com azul glassmorphism

### O que será feito

Atualizar o estilo dos botões de navegação (setas ChevronLeft/ChevronRight) nos controladores — tanto no `VendedorCarousel` quanto nos seletores de mês e região do CAC — aplicando um visual azul com glassmorphism.

### Alterações em `src/pages/marketing/PerformanceMinimalista.tsx`

1. **VendedorCarousel** (linhas 578, 602): Trocar a classe dos botões de seta de:
   - `text-white/70 hover:text-white hover:bg-white/10`
   - Para: `bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm text-blue-300 hover:bg-blue-500/30 hover:text-blue-200`

2. **Seletores de mês e região do CAC** (linhas 646, 657, 668, 679): Aplicar o mesmo estilo glassmorphism azul nos 4 botões de seta.

Total: 6 botões atualizados com o mesmo padrão visual.

