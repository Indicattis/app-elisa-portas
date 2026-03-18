

## Plano: Modal de Preenchimento Paralelo (Wizard de 4 Etapas)

### Resumo

Criar um botão no header do pedido (`headerActions`) que abre um modal wizard com 4 etapas sequenciais para preenchimento rápido do pedido. Cada etapa reutiliza os componentes existentes da página.

### Etapas do Wizard

1. **Medidas das Portas** — Reutiliza a lógica de `MedidasPortasSection` (inputs de largura/altura com SVG)
2. **Itens do Pedido** — Reutiliza `PedidoLinhasEditor` (modal de adição de linhas, listagem)
3. **Observações da Visita Técnica** — Reutiliza `ObservacoesPortaForm` (formulário por porta)
4. **Observações do Pedido** — Textarea simples para `pedido.observacoes`, com botão "Concluir"

### Arquivos

**Novo**: `src/components/pedidos/PreenchimentoParaleloModal.tsx`
- Dialog/modal com stepper visual (indicador de etapa 1/4, 2/4, etc.)
- Estado interno `etapaAtual` (0-3)
- Botões "Próximo" e "Voltar" no footer
- Etapa final: botão "Concluir" que salva observações e fecha o modal
- Recebe como props: `produtos`, `linhas`, `pedidoId`, `vendaId`, handlers de salvar (medidas, linhas, observações), `usuarios`, `autorizados`, dados de observações existentes

**Editar**: `src/pages/administrativo/PedidoViewMinimalista.tsx`
- Adicionar botão "Preencher Pedido" (ícone `ClipboardList`) no `headerActions` (ao lado do refresh e badge de etapa)
- Importar e renderizar `PreenchimentoParaleloModal`
- Controlar estado `open` do modal
- Botão visível apenas quando `podeEditarLinhas` (etapa aberta ou em produção)

### Detalhes de implementação

- Cada etapa renderiza o componente existente diretamente dentro do modal, sem duplicar lógica
- Etapa 1 (Medidas): Renderiza `MedidasPortasSection` inline com `onRefresh` para atualizar dados ao salvar
- Etapa 2 (Itens): Renderiza `PedidoLinhasEditor` com as mesmas props da página
- Etapa 3 (Observações Visita): Renderiza lista de `ObservacoesPortaForm` com folder cards para navegação
- Etapa 4 (Observações Pedido): Textarea + botão salvar, ao concluir fecha o modal e faz refresh dos dados
- O stepper mostra etapas condicionalmente: se não há portas de enrolar, pula etapas 1 e 3
- Modal usa `DialogContent` com `max-w-4xl` e scroll interno para acomodar conteúdo

