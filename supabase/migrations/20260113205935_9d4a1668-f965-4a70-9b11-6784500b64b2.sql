-- Transferir vendas do cliente CPF 00.000.000/0000-00 para o cliente CNPJ 14.436.911/0001-70
UPDATE vendas 
SET cliente_id = 'faec2a62-f655-4237-85ee-bdec91c57432'
WHERE cliente_id = '823172c9-68c7-4819-9ec9-2f898118f4a3';