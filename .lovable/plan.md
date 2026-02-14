

# Mover conteudo de /producao/home para /producao

## Resumo
O login em `/producao/login` redireciona para `/producao`, mas essa rota renderiza `HubFabrica` em vez do conteudo correto (`ProducaoHome`). A solucao e substituir o `HubFabrica` por `ProducaoHome` na rota `/producao` (protegida com `ProtectedProducaoRoute`) e remover a rota `/producao/home`.

## Alteracoes

### 1. `src/App.tsx`
- **Linha 552**: Substituir `<HubFabrica />` por `ProducaoHome` envolto em `ProducaoAuthProvider`, `ProtectedProducaoRoute` e `ProducaoLayout`
- **Linhas 692-701**: Remover a rota `/home` do bloco de rotas aninhadas (nao existe mais)

### 2. `src/components/producao/ProducaoHeader.tsx`
- Atualizar `navigate('/producao/home')` para `navigate('/producao')` no botao voltar

### 3. `src/pages/ProducaoMeuHistorico.tsx`
- Atualizar `navigate('/producao/home')` para `navigate('/producao')`

### 4. `src/pages/producao/ConferenciaEstoqueProducao.tsx`
- Atualizar `returnPath="/producao/home"` para `returnPath="/producao"`

### 5. `src/pages/producao/ConferenciaAlmoxProducao.tsx`
- Atualizar `returnPath="/producao/home"` para `returnPath="/producao"`

### 6. `src/pages/HubFabrica.tsx`
- Atualizar `path: "/producao/home"` para `path: "/producao"`

## Secao Tecnica

### Rota principal (App.tsx)
A rota `/producao` deixa de ser simples (`<HubFabrica />`) e passa a ser:
```text
<Route path="/producao" element={
  <ProducaoAuthProvider>
    <ProtectedProducaoRoute>
      <ProducaoLayout>
        <ProducaoHome />
      </ProducaoLayout>
    </ProtectedProducaoRoute>
  </ProducaoAuthProvider>
} />
```

### Arquivos afetados
1. `src/App.tsx` - substituir elemento da rota `/producao` + remover rota `/home`
2. `src/components/producao/ProducaoHeader.tsx` - atualizar navegacao
3. `src/pages/ProducaoMeuHistorico.tsx` - atualizar navegacao
4. `src/pages/producao/ConferenciaEstoqueProducao.tsx` - atualizar returnPath
5. `src/pages/producao/ConferenciaAlmoxProducao.tsx` - atualizar returnPath
6. `src/pages/HubFabrica.tsx` - atualizar path do botao
