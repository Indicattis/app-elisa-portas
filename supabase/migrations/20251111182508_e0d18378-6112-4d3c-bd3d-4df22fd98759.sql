-- Adicionar o cargo 'tecnico_qualidade' ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tecnico_qualidade';