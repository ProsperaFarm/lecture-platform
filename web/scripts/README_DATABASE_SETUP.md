# Database Setup Guide

Este guia explica como configurar o banco de dados PostgreSQL local para desenvolvimento.

## Pré-requisitos

- PostgreSQL instalado localmente
- Banco de dados criado (ex: `prospera_academy_dev`)
- Arquivo `.env` ou `.env.local` configurado com `DATABASE_URL`

## Passos para Setup

### 1. Criar o banco de dados (se ainda não existe)

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE prospera_academy_dev;

# Sair do psql
\q
```

### 2. Inicializar o schema do banco

Execute o script SQL para criar todas as tabelas:

```bash
# Opção 1: Via psql
psql -U postgres -d prospera_academy_dev -f scripts/init-database.sql

# Opção 2: Via npm script (se configurado)
npm run db:init
```

### 3. Popular o banco com dados do curso

Após criar as tabelas, execute o seeding:

```bash
npm run db:seed:normalized
```

## Estrutura das Tabelas

O script `init-database.sql` cria as seguintes tabelas:

### Tabelas Principais
- **courses**: Cursos disponíveis
- **modules**: Módulos de cada curso
- **sections**: Seções dentro dos módulos
- **lessons**: Aulas individuais (com duração em segundos)

### Tabelas de Usuário
- **user_progress**: Progresso do usuário em cada aula
- **user_notes**: Anotações do usuário em momentos específicos das aulas
- **ratings**: Avaliações (likes/dislikes/stars) de aulas e cursos

### Tabelas Auxiliares
- **video_transcripts**: Transcrições e resumos de vídeos
- **course_materials**: Materiais complementares (PDFs, slides, etc.)

## Verificar Tabelas Criadas

```bash
psql -U postgres -d prospera_academy_dev

# Listar todas as tabelas
\dt

# Ver estrutura de uma tabela específica
\d lessons

# Sair
\q
```

## Troubleshooting

### Erro: "relation does not exist"
- Certifique-se de que executou `init-database.sql` antes do seeding
- Verifique se está conectando ao banco correto (confira `DATABASE_URL`)

### Erro: "permission denied"
- Verifique as permissões do usuário PostgreSQL
- Pode ser necessário usar `sudo -u postgres psql`

### Erro: "database does not exist"
- Crie o banco de dados primeiro com `CREATE DATABASE`

## Resetar o Banco (CUIDADO!)

Para limpar e recriar tudo do zero:

```bash
# Dropar e recriar banco
psql -U postgres -c "DROP DATABASE IF EXISTS prospera_academy_dev;"
psql -U postgres -c "CREATE DATABASE prospera_academy_dev;"

# Recriar schema
psql -U postgres -d prospera_academy_dev -f scripts/init-database.sql

# Popular dados
npm run db:seed:normalized
```

## Próximos Passos

Após o setup completo:

1. ✅ Banco de dados criado
2. ✅ Tabelas inicializadas
3. ✅ Dados populados via seeding
4. 🚀 Rodar aplicação: `npm run dev`
