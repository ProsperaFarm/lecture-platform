#!/bin/bash

# Script para aguardar o banco de dados estar pronto no CI/CD
# Baseado no script wait-for-db.mjs mas adaptado para CI/CD

set -e

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-grand_operation_farms_test}

echo "Waiting for database to be ready..."
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"

# Função para verificar se o banco está pronto usando docker exec
check_db_docker() {
    docker exec grand_operation_farms_cicd_db pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1
}

# Função para verificar se o banco está pronto usando psql (se disponível)
check_db_psql() {
    if command -v psql >/dev/null 2>&1; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1
    else
        return 1
    fi
}

drop_initialization_table() {
    echo "Dropping _initialization_complete table..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DROP TABLE IF EXISTS _initialization_complete;" > /dev/null 2>&1
}

# Aguardar até 60 segundos
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts..."
    
    # Tentar primeiro com docker exec, depois com psql
    if check_db_docker; then
        echo "✅ Database is ready (docker exec)!"
        drop_initialization_table
        exit 0
    elif check_db_psql; then
        echo "✅ Database is ready (psql)!"
        drop_initialization_table
        exit 0
    fi
    
    echo "⏳ Database not ready yet, waiting 1 second..."
    sleep 1
    attempt=$((attempt + 1))
done

echo "❌ Database failed to start within $max_attempts seconds"
exit 1
