-- Adicionar foreign key constraint para orcamento_produtos se não existir
DO $$ 
BEGIN
    -- Verificar se a foreign key já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'orcamento_produtos_orcamento_id_fkey'
        AND table_name = 'orcamento_produtos'
    ) THEN
        -- Adicionar a foreign key constraint
        ALTER TABLE public.orcamento_produtos 
        ADD CONSTRAINT orcamento_produtos_orcamento_id_fkey 
        FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id) ON DELETE CASCADE;
    END IF;
END $$;