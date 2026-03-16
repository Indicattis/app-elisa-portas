

## Plano: Remover sistema de estrela/triângulo dos cards de gestão de pedidos

### Problema
Os cards de pedidos (`PedidoCard.tsx`) exibem ícones de estrela (fidelizado) e triângulo (parceiro) ao lado do nome do cliente. O usuário quer remover esses símbolos.

### Mudanças

**`src/components/pedidos/PedidoCard.tsx`**
- **Linhas 1202-1215**: Remover o bloco "Col 2: Símbolos do cliente" que renderiza Star e Triangle no layout desktop/expandido
- **Linhas 2077-2089**: Remover o bloco "Símbolos do cliente" que renderiza Star e Triangle no layout compacto/mobile
- Limpar imports de `Star` e `Triangle` de lucide-react se não forem mais usados no arquivo

