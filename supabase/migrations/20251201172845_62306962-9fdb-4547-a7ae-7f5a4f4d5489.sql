-- Aumentar o tamanho do campo status para acomodar status longos como 'processando_autorizacao'
ALTER TABLE notas_fiscais 
ALTER COLUMN status TYPE varchar(50);

-- Também aumentar status_sefaz caso necessário
ALTER TABLE notas_fiscais 
ALTER COLUMN status_sefaz TYPE varchar(50);