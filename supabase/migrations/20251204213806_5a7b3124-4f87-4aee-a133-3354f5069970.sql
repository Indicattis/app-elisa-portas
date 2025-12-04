-- Criar bucket para comprovantes de pagamento (políticas já existem)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes-pagamento', 'comprovantes-pagamento', true)
ON CONFLICT (id) DO UPDATE SET public = true;