
# Reformular pagina /logistica/neos como formulario de cadastro

## O que muda
A pagina atual e uma listagem com tabela e modais. O usuario quer uma **pagina de formulario dedicada** onde se escolhe o tipo (Instalacao ou Correcao) e preenche os campos diretamente na pagina, sem modais.

## Estrutura da nova pagina

### Layout
- `MinimalistLayout` com titulo "Novo Servico Neo", breadcrumb Home > Logistica > Servicos Neo
- Seletor de tipo no topo: tabs ou radio para alternar entre "Neo Instalacao" e "Neo Correcao"
- Formulario completo renderizado na pagina (sem modal)
- Botoes "Cancelar" (volta para /logistica) e "Salvar" no rodape

### Campos do formulario
Todos os campos ja existentes nos modais, agora inline:
- Cliente (input texto)
- Estado e Cidade (selects)
- Data e Hora (inputs date/time — hora so para correcao)
- Tipo de Responsavel (radio: Equipe Interna / Autorizado)
- Equipe ou Autorizado (select condicional)
- Valor Total e Valor a Receber (inputs numericos)
- Descricao (textarea)
- Etapa Causadora (select)

### Modo edicao
- A rota aceitara um parametro opcional: `/logistica/neos/editar/:tipo/:id`
- Ou alternativamente, a pagina de listagem (que sera mantida como segunda rota ou integrada) passara state via `navigate`
- Para simplicidade, a pagina de cadastro recebera dados de edicao via `location.state`

### Fluxo
1. Usuario clica "Novo" na listagem ou no hub → vai para `/logistica/neos/novo`
2. Escolhe o tipo (Instalacao ou Correcao)
3. Preenche o formulario
4. Clica "Salvar" → insere no banco → redireciona para `/logistica/neos` (listagem)
5. Para editar: clica no item na listagem → navega para `/logistica/neos/novo` com state contendo os dados

## Detalhes tecnicos

### Arquivo: `src/pages/logistica/NeosCadastroForm.tsx` (novo)
- Pagina de formulario completo
- Usa `MinimalistLayout` com backPath `/logistica/neos`
- State local para todos os campos
- Tabs no topo para escolher tipo (instalacao/correcao)
- Ao trocar tipo, reseta campos especificos (hora so existe em correcao)
- Mutations de criacao/edicao com React Query + Supabase
- Apos salvar, `navigate('/logistica/neos')` com toast de sucesso
- Se receber `location.state.editData`, preenche campos para edicao

### Arquivo: `src/pages/logistica/NeosCadastro.tsx` (atualizado)
- Manter a listagem existente
- Botao "Novo" agora faz `navigate('/logistica/neos/novo')`
- Botao de editar em cada item faz `navigate('/logistica/neos/novo', { state: { editData: item } })`

### Arquivo: `src/App.tsx`
- Adicionar rota `/logistica/neos/novo` apontando para `NeosCadastroForm`

## Arquivos envolvidos
- `src/pages/logistica/NeosCadastroForm.tsx` (novo)
- `src/pages/logistica/NeosCadastro.tsx` (ajustar botoes para navegar)
- `src/App.tsx` (nova rota)
