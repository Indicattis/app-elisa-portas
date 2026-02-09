
# Rotas contextuais para estados em /logistica/autorizados

## Resumo

Atualmente, ao clicar num estado em `/logistica/autorizados`, a navegacao vai para `/direcao/autorizados/estado/:id` porque os caminhos estao hardcoded. A correcao fara com que a navegacao respeite o contexto (direcao ou logistica).

## Alteracoes

### 1. `AutorizadosPrecosDirecao.tsx` (linha 246)
- Trocar o navigate hardcoded para usar o prefixo correto baseado na prop `contexto`
- De: `navigate('/direcao/autorizados/estado/${estado.id}')`
- Para: `navigate('/${contexto === 'logistica' ? 'logistica' : 'direcao'}/autorizados/estado/${estado.id}')`

### 2. `EstadoAutorizadosDirecao.tsx`
- Adicionar prop `contexto?: 'direcao' | 'logistica'` (ou detectar pelo pathname via `useLocation`)
- Atualizar todos os paths hardcoded (breadcrumbs, botao voltar, navigate para editar) para usar o prefixo correto
- Paths afetados: breadcrumb "Direcao"/"Logistica", breadcrumb "Autorizados", botao voltar, navigate de editar autorizado

### 3. `App.tsx`
- Adicionar rotas espelhadas para logistica:
  - `/logistica/autorizados/estado/:estadoId` -> `EstadoAutorizadosDirecao` (com contexto logistica)
  - `/logistica/autorizados/estado/:estadoId/novo` -> `NovoAutorizadoDirecao`
  - `/logistica/autorizados/novo` -> `NovoAutorizadoDirecao`
  - `/logistica/autorizados/:id/editar` -> `EditarAutorizadoDirecao`

### 4. Criar wrapper `src/pages/logistica/EstadoAutorizadosLogistica.tsx`
- Componente simples que renderiza `EstadoAutorizadosDirecao` com `contexto="logistica"`

### 5. `NovoAutorizadoDirecao.tsx` e `EditarAutorizadoDirecao.tsx`
- Detectar contexto pelo pathname (se contem `/logistica/`) e ajustar breadcrumbs e navegacao de volta

## Detalhes tecnicos

A abordagem mais simples e detectar o contexto pelo pathname usando `useLocation()`, evitando a necessidade de props em todos os componentes de pagina. Exemplo:

```typescript
const { pathname } = useLocation();
const contexto = pathname.startsWith('/logistica') ? 'logistica' : 'direcao';
const basePath = `/${contexto}/autorizados`;
```

### Arquivos

1. **Editar**: `src/pages/direcao/AutorizadosPrecosDirecao.tsx` -- usar contexto no navigate do estado
2. **Editar**: `src/pages/direcao/EstadoAutorizadosDirecao.tsx` -- detectar contexto e ajustar paths
3. **Editar**: `src/pages/direcao/NovoAutorizadoDirecao.tsx` -- detectar contexto e ajustar breadcrumbs/back
4. **Editar**: `src/pages/direcao/EditarAutorizadoDirecao.tsx` -- detectar contexto e ajustar breadcrumbs/back
5. **Editar**: `src/App.tsx` -- adicionar rotas espelhadas para logistica
