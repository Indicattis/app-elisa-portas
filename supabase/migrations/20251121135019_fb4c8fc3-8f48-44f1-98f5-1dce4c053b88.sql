-- Inserir template de garantia para testes
INSERT INTO contratos_templates (nome, descricao, conteudo, ativo, ordem)
VALUES (
  'Termo de Garantia - Teste',
  'Template de garantia com todas as variáveis para teste',
  'TERMO DE GARANTIA DE PRODUTOS

IDENTIFICAÇÃO DO CONTRATO
Número do Contrato: {venda_numero}
Data de Emissão: {data_geracao}


PARTES CONTRATANTES

CONTRATADA:
Empresa: {empresa_nome}
CNPJ: {empresa_cnpj}
Endereço: {empresa_endereco}
Cidade: {empresa_cidade}
CEP: {empresa_cep}

CONTRATANTE:
Nome: {cliente_nome}
CPF: {cliente_cpf}
Telefone: {cliente_telefone}
E-mail: {cliente_email}
Endereço: {cliente_endereco}
Bairro: {cliente_bairro}
Cidade: {cliente_cidade}
Estado: {cliente_estado}
CEP: {cliente_cep}


DADOS DA VENDA

Data da Venda: {venda_data}
Valor Total: {venda_valor_total}
Valor dos Produtos: {venda_valor_produtos}
Valor da Instalação: {venda_valor_instalacao}
Valor do Frete: {venda_valor_frete}
Forma de Pagamento: {venda_forma_pagamento}
Número de Parcelas: {venda_numero_parcelas}
Valor de Entrada: {venda_valor_entrada}
Previsão de Entrega: {venda_previsao_entrega}


PRODUTOS ADQUIRIDOS

{produtos_lista}

Quantidade Total de Produtos: {produtos_quantidade_total}


CONDIÇÕES DE GARANTIA

1. PRAZO DE GARANTIA
A CONTRATADA garante os produtos pelo prazo de 12 (doze) meses a contar da data de entrega/instalação, conforme previsto em {venda_previsao_entrega}.

2. COBERTURA DA GARANTIA
A garantia cobre defeitos de fabricação e instalação realizados pela CONTRATADA, incluindo:
- Defeitos em materiais
- Problemas de instalação
- Falhas de funcionamento

3. EXCLUSÕES DA GARANTIA
Não estão cobertos pela garantia:
- Danos causados por uso inadequado
- Manutenção realizada por terceiros não autorizados
- Danos causados por intempéries ou casos fortuitos
- Desgaste natural do produto

4. ATENDIMENTO
Para acionamento da garantia, o CONTRATANTE deverá entrar em contato:
- Atendente responsável: {atendente_nome}
- Telefone: {atendente_telefone}
- Empresa: {empresa_nome}

5. DISPOSIÇÕES GERAIS
- A garantia é pessoal e intransferível
- O produto deve ser utilizado conforme orientações fornecidas
- A CONTRATADA se compromete a realizar o reparo ou substituição em até 30 dias úteis


ACEITAÇÃO DOS TERMOS

O CONTRATANTE declara ter lido e aceito todos os termos deste documento de garantia, referente à venda número {venda_numero}, no valor total de {venda_valor_total}.


Local e Data: _____________________, {data_geracao}


_________________________________
CONTRATANTE
{cliente_nome}
CPF: {cliente_cpf}


_________________________________
CONTRATADA
{empresa_nome}
CNPJ: {empresa_cnpj}
Representante: {atendente_nome}',
  true,
  1
);