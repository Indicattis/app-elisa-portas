-- Add column to track paint recharge in pintura_inicios table
ALTER TABLE pintura_inicios 
ADD COLUMN recarga_realizada BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN recarga_realizada_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN recarga_realizada_por UUID REFERENCES admin_users(id);