ALTER TABLE linhas_ordens DROP CONSTRAINT linhas_ordens_tipo_ordem_check;

ALTER TABLE linhas_ordens ADD CONSTRAINT linhas_ordens_tipo_ordem_check
  CHECK (tipo_ordem = ANY (ARRAY[
    'soldagem', 'perfiladeira', 'separacao', 'qualidade',
    'pintura', 'instalacao', 'embalagem'
  ]));