
# Pagina de edicao de autorizado no estilo minimalista

## Resumo

Criar uma nova pagina de edicao em `/direcao/autorizados/:id/editar` com o tema escuro (estilo minimalista) consistente com a pagina de criacao (`NovoAutorizadoDirecao`). A pagina sera baseada em `ParceiroEdit.tsx` mas adaptada para o contexto da direcao, incluindo gerenciamento de cidades secundarias. O botao de editar na listagem sera atualizado para apontar para a nova rota.

## Detalhes tecnicos

### 1. Criar pagina de edicao

**Criar `src/pages/direcao/EditarAutorizadoDirecao.tsx`**:
- Copia adaptada de `ParceiroEdit.tsx` com:
  - Tipo fixo `autorizado` (sem selecao de tipo parceiro).
  - Tema escuro: fundo preto, inputs com `bg-white/5 border-white/10 text-white`.
  - `AnimatedBreadcrumb`: Home > Direcao > Autorizados > Editar.
  - Header com botao voltar para `/direcao/autorizados`.
  - Secao de cidades secundarias (carregar existentes de `autorizado_cidades_secundarias`, permitir adicionar/remover).
  - Ao salvar, sincronizar cidades secundarias (deletar todas e reinserir).
  - Navegacao pos-save volta para `/direcao/autorizados`.
  - Manter funcionalidades: logo upload, contrato upload, geocodificacao, reset de tempo.

### 2. Registrar rota

**Editar `src/App.tsx`**:
- Importar `EditarAutorizadoDirecao`.
- Adicionar rota `/direcao/autorizados/:id/editar` com `ProtectedRoute routeKey="direcao_hub"`.

### 3. Atualizar navegacao de edicao

**Editar `src/pages/direcao/AutorizadosPrecosDirecao.tsx`**:
- Alterar `handleEditAutorizado` de `navigate('/dashboard/parceiros/${id}/edit/autorizado')` para `navigate('/direcao/autorizados/${id}/editar')`.

### Arquivos

1. **Criar**: `src/pages/direcao/EditarAutorizadoDirecao.tsx`
2. **Editar**: `src/App.tsx` -- nova rota
3. **Editar**: `src/pages/direcao/AutorizadosPrecosDirecao.tsx` -- atualizar navigate do botao editar
