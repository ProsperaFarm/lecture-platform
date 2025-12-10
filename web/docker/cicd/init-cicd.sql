-- Script de inicialização para CI/CD
-- Este script é executado quando o container PostgreSQL é iniciado

-- Criar tabela para controlar inicialização
CREATE TABLE IF NOT EXISTS _initialization_complete (
    id SERIAL PRIMARY KEY,
    initialized_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    environment TEXT DEFAULT 'cicd'
);

-- Inserir registro de inicialização
INSERT INTO _initialization_complete (environment) VALUES ('cicd')
ON CONFLICT DO NOTHING;

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Database initialized for CI/CD environment at %', CURRENT_TIMESTAMP;
END $$;
