-- Caso 7: Adicionar colunas para tracking de quem pegou o handoff
ALTER TABLE conversas
ADD COLUMN claimed_by VARCHAR,
ADD COLUMN claimed_at TIMESTAMPTZ;

-- Criar índice para performance
CREATE INDEX idx_conversas_claimed ON conversas(claimed_by, claimed_at) WHERE claimed_by IS NOT NULL;

COMMENT ON COLUMN conversas.claimed_by IS 'Nome do atendente que pegou o handoff';
COMMENT ON COLUMN conversas.claimed_at IS 'Timestamp de quando o atendente assumiu a conversa';