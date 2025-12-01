-- Expandir coluna chave_acesso para acomodar prefixo "NFe" (47 caracteres total)
ALTER TABLE notas_fiscais 
ALTER COLUMN chave_acesso TYPE varchar(50);