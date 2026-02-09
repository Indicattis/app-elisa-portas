
# Fundir paginas de autorizados (Direcao + Logistica)

## Resumo

A pagina `/direcao/autorizados` atualmente exibe apenas a grade de estados. A pagina `/logistica/autorizados` exibe apenas a tabela de acordos. A proposta e criar um componente unificado que exibe **ambas as secoes** (estados + acordos), recebendo props para adaptar breadcrumbs e navegacao conforme o contexto (direcao ou logistica).

## Estrutura final

Ambas as rotas renderizarao o mesmo conteudo:
1. Header com titulo, botoes "Novo Autorizado", "Novo Estado" e "Novo Acordo"
2. Secao "Estados Cadastrados" com grid de cards arrastavel (drag-and-drop)
3. Secao "Acordos com Autorizados" com tabela filtravel (busca + filtro de status)

## Alteracoes

### 1. Expandir `AutorizadosPrecosDirecao.tsx` para incluir acordos
- Importar `useAcordosAutorizados` e `NovoAcordoDialog`
- Adicionar secao de acordos abaixo dos estados (filtros de busca/status + tabela completa)
- Adicionar botao "Novo Acordo" no header
- Reutilizar toda a logica de filtros, badges de portas, status e acoes (editar/excluir) da pagina atual de `AcordosAutorizados.tsx`
- Receber prop opcional `contexto` ('direcao' | 'logistica') para ajustar breadcrumbs e botao voltar

### 2. Criar pagina wrapper `src/pages/logistica/AutorizadosLogistica.tsx`
- Componente simples que importa e renderiza `AutorizadosPrecosDirecao` com `contexto="logistica"`
- Isso garante que `/logistica/autorizados` seja uma copia identica

### 3. Atualizar `App.tsx`
- Alterar a rota `/logistica/autorizados` para apontar para o novo wrapper `AutorizadosLogistica`
- Manter import de `AcordosAutorizados` se usado em outro lugar, ou remover

### 4. Adaptar breadcrumbs e navegacao por contexto
- Direcao: `Home > Direcao > Autorizados` com botao voltar para `/direcao`
- Logistica: `Home > Logistica > Autorizados` com botao voltar para `/logistica`
- As rotas de estado continuam usando `/direcao/autorizados/estado/:id` em ambos os contextos

## Detalhes tecnicos

O componente `AutorizadosPrecosDirecao` passara a aceitar uma prop:

```typescript
interface Props {
  contexto?: 'direcao' | 'logistica';
}
```

A secao de acordos sera adicionada logo apos a secao de estados, com um separador visual. Incluira:
- Campo de busca e filtro de status
- Tabela com colunas: Cliente, Autorizado, Portas, Valor, Status, Data, Criado por, Acoes
- Dialog de novo/editar acordo
- Dialog de confirmacao de exclusao

### Arquivos

1. **Editar**: `src/pages/direcao/AutorizadosPrecosDirecao.tsx` -- adicionar secao de acordos e prop de contexto
2. **Criar**: `src/pages/logistica/AutorizadosLogistica.tsx` -- wrapper que renderiza o componente com contexto logistica
3. **Editar**: `src/App.tsx` -- atualizar rota `/logistica/autorizados`
