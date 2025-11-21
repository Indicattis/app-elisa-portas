import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContratoVariaveis } from "@/types/contrato";
import { formatCurrency } from "@/lib/utils";

export function useContratoVariaveis(vendaId: string) {
  return useQuery({
    queryKey: ['contrato-variaveis', vendaId],
    queryFn: async () => {
      // Buscar venda completa com produtos e atendente
      const { data: venda, error } = await supabase
        .from('vendas')
        .select(`
          *,
          produtos:produtos_vendas(
            *,
            cor:catalogo_cores(nome)
          ),
          atendente:admin_users(nome, telefone)
        `)
        .eq('id', vendaId)
        .single();
      
      if (error) throw error;

      // Buscar configurações da empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      
      if (empresaError) throw empresaError;

      // Formatar lista de produtos incluindo o tipo e detalhes
      const produtosLista = venda.produtos
        ?.map((p: any) => {
          const partes = [];
          
          // Quantidade e descrição
          partes.push(`${p.quantidade || 1}x ${p.descricao || 'Produto'}`);
          
          // Tipo do produto
          if (p.tipo_produto) {
            partes.push(`(${p.tipo_produto})`);
          }
          
          return partes.join(' ');
        })
        .join('\n') || '';

      const produtosQuantidadeTotal = venda.produtos?.reduce(
        (acc: number, p: any) => acc + (p.quantidade || 1), 
        0
      ) || 0;

      const variaveis: ContratoVariaveis = {
        // Cliente
        cliente_nome: venda.cliente_nome || '',
        cliente_telefone: venda.cliente_telefone || '',
        cliente_email: venda.cliente_email || '',
        cliente_cpf: venda.cpf_cliente || '',
        cliente_endereco: '',
        cliente_cidade: venda.cidade || '',
        cliente_estado: venda.estado || '',
        cliente_bairro: venda.bairro || '',
        cliente_cep: venda.cep || '',
        
        // Venda
        venda_numero: venda.id || '',
        venda_data: new Date(venda.data_venda).toLocaleDateString('pt-BR'),
        venda_valor_total: formatCurrency(venda.valor_venda || 0),
        venda_valor_produtos: formatCurrency(venda.valor_venda - (venda.valor_instalacao || 0) - (venda.valor_frete || 0)),
        venda_valor_instalacao: formatCurrency(venda.valor_instalacao || 0),
        venda_valor_frete: formatCurrency(venda.valor_frete || 0),
        venda_forma_pagamento: venda.forma_pagamento || '',
        venda_numero_parcelas: venda.numero_parcelas?.toString() || '',
        venda_valor_entrada: formatCurrency(venda.valor_entrada || 0),
        venda_previsao_entrega: venda.data_prevista_entrega 
          ? new Date(venda.data_prevista_entrega).toLocaleDateString('pt-BR') 
          : '',
        
        // Produtos
        produtos_lista: produtosLista,
        produtos_quantidade_total: produtosQuantidadeTotal.toString(),
        
        // Atendente
        atendente_nome: venda.atendente?.nome || '',
        atendente_telefone: venda.atendente?.telefone || '',
        
        // Empresa (configurável via admin)
        empresa_nome: empresa.nome || '',
        empresa_cnpj: empresa.cnpj || '',
        empresa_endereco: empresa.endereco || '',
        empresa_cidade: empresa.cidade || '',
        empresa_cep: empresa.cep || '',
        
        // Data de geração
        data_geracao: new Date().toLocaleDateString('pt-BR')
      };

      return variaveis;
    },
    enabled: !!vendaId
  });
}

export function substituirVariaveis(texto: string, variaveis: ContratoVariaveis): string {
  let resultado = texto;
  
  Object.entries(variaveis).forEach(([chave, valor]) => {
    const regex = new RegExp(`\\{${chave}\\}`, 'g');
    resultado = resultado.replace(regex, valor || '');
  });
  
  return resultado;
}

export const variaveisDisponiveis = [
  {
    categoria: 'Cliente',
    variaveis: [
      { chave: 'cliente_nome', descricao: 'Nome do cliente' },
      { chave: 'cliente_telefone', descricao: 'Telefone do cliente' },
      { chave: 'cliente_email', descricao: 'E-mail do cliente' },
      { chave: 'cliente_cpf', descricao: 'CPF do cliente' },
      { chave: 'cliente_endereco', descricao: 'Endereço completo' },
      { chave: 'cliente_cidade', descricao: 'Cidade' },
      { chave: 'cliente_estado', descricao: 'Estado' },
      { chave: 'cliente_bairro', descricao: 'Bairro' },
      { chave: 'cliente_cep', descricao: 'CEP' }
    ]
  },
  {
    categoria: 'Venda',
    variaveis: [
      { chave: 'venda_numero', descricao: 'Número da venda' },
      { chave: 'venda_data', descricao: 'Data da venda' },
      { chave: 'venda_valor_total', descricao: 'Valor total' },
      { chave: 'venda_valor_produtos', descricao: 'Valor dos produtos' },
      { chave: 'venda_valor_instalacao', descricao: 'Valor da instalação' },
      { chave: 'venda_valor_frete', descricao: 'Valor do frete' },
      { chave: 'venda_forma_pagamento', descricao: 'Forma de pagamento' },
      { chave: 'venda_numero_parcelas', descricao: 'Número de parcelas' },
      { chave: 'venda_valor_entrada', descricao: 'Valor de entrada' },
      { chave: 'venda_previsao_entrega', descricao: 'Previsão de entrega' }
    ]
  },
  {
    categoria: 'Produtos',
    variaveis: [
      { chave: 'produtos_lista', descricao: 'Lista de produtos' },
      { chave: 'produtos_quantidade_total', descricao: 'Quantidade total de itens' }
    ]
  },
  {
    categoria: 'Atendente',
    variaveis: [
      { chave: 'atendente_nome', descricao: 'Nome do atendente' },
      { chave: 'atendente_telefone', descricao: 'Telefone do atendente' }
    ]
  },
  {
    categoria: 'Empresa',
    variaveis: [
      { chave: 'empresa_nome', descricao: 'Nome da empresa' },
      { chave: 'empresa_cnpj', descricao: 'CNPJ da empresa' },
      { chave: 'empresa_endereco', descricao: 'Endereço da empresa' },
      { chave: 'empresa_cidade', descricao: 'Cidade da empresa' },
      { chave: 'empresa_cep', descricao: 'CEP da empresa' }
    ]
  },
  {
    categoria: 'Outros',
    variaveis: [
      { chave: 'data_geracao', descricao: 'Data de geração do contrato' }
    ]
  }
];
