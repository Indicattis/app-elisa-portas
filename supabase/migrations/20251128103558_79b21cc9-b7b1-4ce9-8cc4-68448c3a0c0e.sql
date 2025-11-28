-- Adicionar coluna cpf na tabela admin_users
ALTER TABLE admin_users ADD COLUMN cpf TEXT;

-- Criar índice para busca por CPF
CREATE INDEX IF NOT EXISTS idx_admin_users_cpf ON admin_users(cpf);

-- Atualizar CPFs dos usuários existentes
UPDATE admin_users SET cpf = '055.361.230-17' WHERE nome = 'Adrian Johann Pedrotti Constante';
UPDATE admin_users SET cpf = '012.097.050-36' WHERE nome = 'Daiane dos Santos Lucrecio';
UPDATE admin_users SET cpf = '033.375.010-10' WHERE nome = 'Eduardo Esteves Alves';
UPDATE admin_users SET cpf = '710.626.352-48' WHERE nome = 'Felinder Alfredo Guedes Puello';
UPDATE admin_users SET cpf = '021.956.000-56' WHERE nome = 'Gabriel Nunes';
UPDATE admin_users SET cpf = '054.920.640-02' WHERE nome = 'Gabriel Ribeiro';
UPDATE admin_users SET cpf = '035.645.240-96' WHERE nome = 'Giovanni Jean da Silva';
UPDATE admin_users SET cpf = '046.273.940-63' WHERE nome = 'Guiherme Martini Dallarosa';
UPDATE admin_users SET cpf = '030.059.910-24' WHERE nome = 'Jhenyfer Rodrigues';
UPDATE admin_users SET cpf = '034.589.020-58' WHERE nome = 'João Vitor de Martins dos Santos';
UPDATE admin_users SET cpf = '046.982.110-85' WHERE nome = 'João Vitor Rech de Oliveira';
UPDATE admin_users SET cpf = '050.273.440-07' WHERE nome = 'João Pedro Staehler Indicatti';
UPDATE admin_users SET cpf = '025.511.750-70' WHERE nome = 'José Fernando Machado dos Santos';
UPDATE admin_users SET cpf = '057.884.270-02' WHERE nome = 'Katriel Nicolas Zaccaria';
UPDATE admin_users SET cpf = '003.237.950-13' WHERE nome = 'Marcos Rogério de Oliveira Siqueira';
UPDATE admin_users SET cpf = '002.731.250-01' WHERE nome = 'Magno Andrigo Siqueira';
UPDATE admin_users SET cpf = '034.542.760-20' WHERE nome = 'Maicon Luan Gonzales de Lima';
UPDATE admin_users SET cpf = '592.718.500-25' WHERE nome = 'Macionir da Silva';
UPDATE admin_users SET cpf = '157.028.687-65' WHERE nome = 'Matheus Jacomes Nascimento';
UPDATE admin_users SET cpf = '960.423.540-00' WHERE nome = 'Paulo Roberto de Oliveira Wolff';
UPDATE admin_users SET cpf = '583.424.860-87' WHERE nome = 'Reinaldo dos Santos';
UPDATE admin_users SET cpf = '806.664.930-49' WHERE nome = 'Reder Romário Aranguiz Pereira';
UPDATE admin_users SET cpf = '872.867.930-04' WHERE nome = 'Wellington Kelvin de Mores';
UPDATE admin_users SET cpf = '006.943.330-35' WHERE nome = 'William Hoffmann';
UPDATE admin_users SET cpf = '039.234.470-00' WHERE nome = 'William Rodrigues Ramos';