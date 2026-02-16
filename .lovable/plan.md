
# Sessao dedicada para atualizar medidas das portas de enrolar

## Resumo
Criar uma sessao visual destacada e dedicada exclusivamente para atualizar as medidas (largura e altura) de cada porta de enrolar (`porta_enrolar`) do pedido. Essa sessao substituira a coluna "Acoes" da tabela de produtos para portas, oferecendo uma experiencia mais intuitiva com desenhos esquematicos de cada porta mostrando largura e altura.

## O que muda

### 1. Nova sessao "Medidas das Portas" acima da tabela de produtos
- Card destacado com borda colorida (ex: `border-blue-500/30`) e fundo diferenciado
- Titulo claro: "Medidas das Portas de Enrolar"
- Grid de cards, um para cada porta de enrolar (expandida por quantidade)
- Cada card contem:
  - Titulo: "Porta de Enrolar #1", "#2", etc.
  - Desenho SVG esquematico de uma porta com setas indicando largura (horizontal, embaixo) e altura (vertical, ao lado)
  - Dois inputs numericos (largura e altura em metros) posicionados junto as setas
  - Botao "Salvar" individual por porta
  - Indicador visual de status (medidas preenchidas vs pendentes)

### 2. Remover coluna "Acoes" da tabela de produtos para portas
- A tabela "Produtos da Venda" continua existindo para exibir todos os produtos
- Remover a coluna "Acoes" e a logica de edicao inline (pencil icon) para portas
- Manter a edicao de cor para pintura_epoxi na tabela (se necessario)

## Detalhes tecnicos

### Arquivo: `src/components/pedidos/MedidasPortasSection.tsx` (novo)
Componente dedicado que recebe as portas de enrolar e renderiza:
- Filtra apenas produtos `porta_enrolar` da venda
- Usa `expandirPortasPorQuantidade` para gerar cards individuais
- Cada card contem um SVG esquematico com:
  - Retangulo representando a porta
  - Seta horizontal com label "Largura" e input
  - Seta vertical com label "Altura" e input
- State local para largura/altura de cada porta
- Funcao de salvar que atualiza `produtos_vendas` via supabase (largura, altura, tamanho)
- Badge de status: verde se medidas preenchidas, amarelo se pendentes

### Arquivo: `src/pages/administrativo/PedidoViewMinimalista.tsx` (alterado)
- Importar e renderizar `MedidasPortasSection` antes da tabela "Produtos da Venda"
- Passar os produtos, funcao de refresh e permissao de edicao
- Na tabela de produtos: remover coluna "Acoes" para portas (manter para pintura)
- Remover states de edicao inline de portas (`editandoProduto`, `editLargura`, `editAltura`) que migraram para o novo componente

### SVG da porta (esquema visual)
```text
        +------ Largura ------+
        |                     |
   A    |                     |
   l    |    +-----------+    |
   t    |    |           |    |
   u    |    |   PORTA   |    |
   r    |    |           |    |
   a    |    +-----------+    |
        |                     |
        +---------------------+
             [__4.65m__]
```
O SVG sera simples e minimalista, com cores claras sobre fundo escuro, usando linhas tracejadas e setas para indicar as dimensoes.

### Arquivos envolvidos
- `src/components/pedidos/MedidasPortasSection.tsx` - novo componente
- `src/pages/administrativo/PedidoViewMinimalista.tsx` - integrar nova sessao e simplificar tabela
