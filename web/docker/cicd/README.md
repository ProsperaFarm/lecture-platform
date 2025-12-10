# Configuração Docker Compose para CI/CD

Esta pasta contém a configuração Docker Compose específica para o ambiente de CI/CD (GitHub Actions).

## Estrutura

```
docker/cicd/
├── docker-compose-cicd.yaml    # Configuração Docker Compose para CI/CD
├── init-cicd.sql              # Script de inicialização do banco
├── wait-for-db-cicd.sh        # Script para aguardar banco estar pronto
└── README.md                  # Esta documentação
```

## Configuração do Banco de Dados

### docker-compose-cicd.yaml

- **Imagem**: `postgres:16.5-alpine` (versão leve e estável)
- **Porta**: `5432:5432` (padrão PostgreSQL)
- **Banco**: `grand_operation_farms_test`
- **Usuário/Senha**: `postgres/postgres`
- **Healthcheck**: Verifica se o banco está pronto
- **Sem persistência**: Banco limpo a cada execução

### Características Específicas para CI/CD

1. **Sem Volumes de Dados**: Garante que o banco seja limpo a cada execução
2. **Healthcheck Robusto**: Aguarda até 10 tentativas com intervalo de 5s
3. **Restart Policy**: `"no"` - não reinicia automaticamente
4. **Script de Inicialização**: Executa `init-cicd.sql` na primeira inicialização

## Scripts

### init-cicd.sql

Script executado automaticamente quando o container PostgreSQL é iniciado:

- Cria tabela `_initialization_complete` para controle
- Registra a inicialização com timestamp
- Log de inicialização para debug

### wait-for-db-cicd.sh

Script bash para aguardar o banco estar pronto:

- Aguarda até 60 segundos
- Verifica conectividade com `psql`
- Logs detalhados do processo
- Exit code 0 = sucesso, 1 = falha

## Uso no GitHub Actions

### Pipeline Atualizado

O pipeline `.github/workflows/ci.yml` foi atualizado para:

1. **Iniciar Banco**: `docker-compose -f docker-compose-cicd.yaml up -d`
2. **Aguardar Pronto**: Executa `wait-for-db-cicd.sh`
3. **Executar Migrações**: Prisma + DML
4. **Executar Testes**: BDD + API
5. **Parar Banco**: `docker-compose down`

### Variáveis de Ambiente

O script de espera usa estas variáveis (com valores padrão):

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=grand_operation_farms_test
```

## Diferenças do Ambiente Local

| Aspecto | Local (docker/test/) | CI/CD (docker/cicd/) |
|---------|---------------------|---------------------|
| **Porta** | 6432 | 5432 |
| **Versão PostgreSQL** | 15 | 16.5-alpine |
| **Persistência** | Volume local | Sem persistência |
| **Restart** | always | no |
| **Healthcheck** | 5 tentativas | 10 tentativas |
| **Script de Espera** | Node.js | Bash |

## Troubleshooting

### Problema: Banco não inicia
```bash
# Verificar logs do container
docker logs grand_operation_farms_cicd_db

# Verificar se a porta está livre
netstat -tulpn | grep 5432
```

### Problema: Script de espera falha
```bash
# Testar conectividade manual
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d grand_operation_farms_test -c "SELECT 1;"

# Verificar se PostgreSQL client está instalado
which psql
```

### Problema: Migrações falham
```bash
# Verificar se o banco está pronto
docker exec grand_operation_farms_cicd_db pg_isready -U postgres

# Verificar tabelas criadas
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d grand_operation_farms_test -c "\dt"
```

## Teste Local

Para testar a configuração localmente:

```bash
# Iniciar banco CI/CD
cd docker/cicd
docker-compose -f docker-compose-cicd.yaml up -d

# Aguardar banco estar pronto
./wait-for-db-cicd.sh

# Testar conectividade
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d grand_operation_farms_test -c "SELECT * FROM _initialization_complete;"

# Parar banco
docker-compose -f docker-compose-cicd.yaml down
```

## Benefícios da Nova Configuração

1. **Isolamento**: Configuração específica para CI/CD
2. **Confiabilidade**: Healthcheck robusto e script de espera
3. **Performance**: Imagem Alpine mais leve
4. **Debugging**: Logs detalhados e scripts de diagnóstico
5. **Manutenibilidade**: Configuração centralizada e documentada
