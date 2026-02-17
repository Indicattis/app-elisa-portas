
# Criar pagina /direcao/metas/fabrica/instalacoes

## Resumo

Criar uma pagina para listar os colaboradores do setor de instalacao, agrupados por equipe, seguindo o mesmo padrao visual da pagina de metas da fabrica (`MetasFabricaDirecao.tsx`). A pagina usara o `MinimalistLayout` e mostrara as equipes de instalacao com seus membros.

## Dados existentes

Colaboradores do setor de instalacao (roles: `gerente_instalacoes`, `instalador`, `aux_instalador`):
- William Rodrigues Ramos (gerente)
- Maicon Luan (instalador)
- Paulo Roberto (instalador)
- William Hoffmann (instalador)
- Gabriel Nunes (aux)
- Matheus das Neves (aux)
- Wellington Kelvin (aux)

Equipes:
- Equipe 1 (azul) - William Hoffmann + membro: William Hoffmann (?)
- Equipe 2 (vermelho) - Paulo Roberto + membros: Gabriel Nunes
- Equipe 3 (roxo) - Maicon Luan + membros: Matheus das Neves

## Detalhes tecnicos

### 1. Novo arquivo: `src/pages/direcao/MetasInstalacoesDirecao.tsx`

Pagina seguindo o padrao de `MetasFabricaDirecao.tsx`:
- Usa `MinimalistLayout` com breadcrumbs (Home > Direcao > Metas > Instalacoes)
- Busca colaboradores do setor de instalacao via `admin_users` (roles: `gerente_instalacoes`, `instalador`, `aux_instalador`)
- Busca equipes via `equipes_instalacao` com membros
- Agrupa por equipe: mostra cada equipe como um card com cor, responsavel e membros listados abaixo
- Colaboradores sem equipe aparecem em secao separada "Sem equipe"
- Cada colaborador mostra avatar, nome e role (traduzido)
- Busca metas individuais ativas para mostrar icone Trophy

### 2. Arquivo: `src/App.tsx`

- Importar `MetasInstalacoesDirecao`
- Adicionar rota: `/direcao/metas/fabrica/instalacoes` com `ProtectedRoute routeKey="direcao_hub"`

### 3. Arquivo: `src/pages/direcao/MetasHubDirecao.tsx`

- Alterar o item "Instalacoes" de `ativo: false` para `ativo: true`
- Atualizar o path para `/direcao/metas/fabrica/instalacoes`

### Layout da pagina

Cada equipe sera exibida como um card com:
- Faixa lateral colorida com a cor da equipe
- Nome da equipe como titulo
- Responsavel destacado com badge "Responsavel"
- Lista de membros com avatar e nome
- Icone Trophy ao lado de quem tem meta ativa
