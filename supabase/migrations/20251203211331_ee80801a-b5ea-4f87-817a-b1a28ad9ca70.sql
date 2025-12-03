-- Criar clientes para vendas com CPF preenchido que não têm cliente_id
DO $$
DECLARE
    venda_record RECORD;
    cliente_existente_id uuid;
    novo_cliente_id uuid;
    cpf_normalizado text;
BEGIN
    -- Iterar sobre todas as vendas com CPF preenchido e sem cliente_id
    FOR venda_record IN 
        SELECT id, cliente_nome, cliente_telefone, cliente_email, cpf_cliente, 
               estado, cidade, cep, bairro, canal_aquisicao_id
        FROM public.vendas 
        WHERE cpf_cliente IS NOT NULL 
          AND cpf_cliente != ''
          AND cliente_id IS NULL
    LOOP
        -- Normalizar CPF (remover caracteres não numéricos)
        cpf_normalizado := regexp_replace(venda_record.cpf_cliente, '\D', '', 'g');
        
        -- Verificar se já existe cliente com este CPF
        SELECT id INTO cliente_existente_id
        FROM public.clientes
        WHERE regexp_replace(cpf_cnpj, '\D', '', 'g') = cpf_normalizado
          AND ativo = true
        LIMIT 1;
        
        IF cliente_existente_id IS NOT NULL THEN
            -- Cliente já existe, apenas vincular
            UPDATE public.vendas 
            SET cliente_id = cliente_existente_id
            WHERE id = venda_record.id;
        ELSE
            -- Criar novo cliente
            INSERT INTO public.clientes (
                nome,
                telefone,
                email,
                cpf_cnpj,
                estado,
                cidade,
                cep,
                bairro,
                canal_aquisicao_id,
                ativo
            ) VALUES (
                venda_record.cliente_nome,
                venda_record.cliente_telefone,
                NULLIF(venda_record.cliente_email, ''),
                venda_record.cpf_cliente,
                venda_record.estado,
                venda_record.cidade,
                venda_record.cep,
                venda_record.bairro,
                venda_record.canal_aquisicao_id,
                true
            )
            RETURNING id INTO novo_cliente_id;
            
            -- Vincular cliente à venda
            UPDATE public.vendas 
            SET cliente_id = novo_cliente_id
            WHERE id = venda_record.id;
        END IF;
    END LOOP;
END $$;