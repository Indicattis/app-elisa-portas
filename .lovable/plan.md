
# Botao de PDF na pagina de Colaboradores

## O que sera feito

Adicionar um botao "Gerar PDF" na barra de acoes do header da pagina `/administrativo/rh-dp/colaboradores` que gera um PDF com a lista de colaboradores **filtrada** (respeitando busca, setor e funcao).

## Detalhes tecnicos

### 1. Novo arquivo: `src/utils/colaboradoresPDFGenerator.ts`

Criar um gerador de PDF seguindo o mesmo padrao do `usuariosPDFGenerator.ts` existente, mas adaptado para colaboradores:

- Cabecalho com logo da empresa e dados
- Tabela com colunas: Nome, Email, CPF, Funcao, Setor, Salario, Modalidade, Em Folha
- Resumo estatistico ao final (total, por setor, por funcao)
- Rodape com dados da empresa

### 2. Editar: `src/pages/administrativo/ColaboradoresMinimalista.tsx`

- Importar o novo gerador de PDF e o icone `FileDown` do lucide-react
- Adicionar funcao `handleGerarPDF` que passa `filteredColaboradores` para o gerador
- Adicionar botao "Gerar PDF" no `headerActions`, ao lado dos botoes existentes ("Gerar Folha", "Solicitacoes")

O botao usara os dados ja filtrados (`filteredColaboradores`) garantindo que o PDF respeite os filtros aplicados na tela.
