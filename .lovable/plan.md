

## Plano: Adicionar seção "Endereço" na página do pedido

### Contexto
A tabela `pedidos_producao` já possui os campos `endereco_rua`, `endereco_numero`, `endereco_bairro`, `endereco_cep`, `endereco_cidade`, `endereco_estado`. Eles já são buscados no `fetchPedidoDetails` (que faz `select("*")`), mas não são exibidos nem editáveis na página.

### Alteração

**`src/pages/administrativo/PedidoViewMinimalista.tsx`**

1. Adicionar estados para edição do endereço (`editandoEndereco`, `enderecoForm` com os 6 campos)
2. Inicializar os estados com os dados do pedido via `useEffect`
3. Adicionar uma nova Card "Endereço" logo após o grid de "Informações do Cliente / Ações Rápidas" (após linha ~562), contendo:
   - Modo visualização: exibe o endereço formatado (rua, número, bairro, cidade/estado, CEP) com botão "Editar"
   - Modo edição: inputs para Rua, Número, Bairro, Cidade, Estado, CEP com botões Salvar/Cancelar
4. Função `handleSalvarEndereco` que faz `supabase.from('pedidos_producao').update({...}).eq('id', pedido.id)` e atualiza o estado local

### Campos do formulário
- **Rua** (text, col-span-2)
- **Número** (text)
- **Bairro** (text)
- **Cidade** (text)
- **Estado** (text, select com UFs ou input curto)
- **CEP** (text, com máscara xxxxx-xxx)

### Visual
Card com mesmo estilo das existentes (`bg-white/5 border-blue-500/10 backdrop-blur-xl`), ícone MapPin, título "Endereço". Grid responsivo 2-3 colunas para os campos.

