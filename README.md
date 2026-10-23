# Passe - Gestão da liga

Aplicação fullstack para gerenciar jogadores, clubes, transferências, contratos,
escalações, partidas e classificação de uma liga fictícia.

## 1. Pré-requisitos

O ambiente de correção utilizado é Ubuntu 24.04 LTS com acesso à internet para
baixar dependências de registros públicos.

| Ferramenta | Versão |
|---|---|
| Ubuntu | 24.04 LTS |
| Docker Engine | 26 ou superior |
| Docker Compose | V2 |
| Node.js | 20.19 ou superior |
| npm | versão distribuída com Node.js |
| Java | 21 |
| Maven | Maven Wrapper 3.10.0 incluído no repositório |
| MySQL | 8.4, iniciado pela imagem pública do Compose |

O desenvolvimento e a execução usam somente imagens públicas (`mysql:8.4`,
`maven:3.9.9-eclipse-temurin-21`, `eclipse-temurin:21-jre`, `node:20-alpine` e
`nginx:1.27-alpine`) e pacotes públicos. Não há submódulos, imagens próprias ou
serviços hospedados necessários.

## 2. Banco de dados

O script versionado [schema.sql](./backend/src/main/resources/schema.sql) cria
as tabelas, chaves, relacionamentos e restrições do banco. A criação padrão
não carrega jogadores, clubes, transações nem partidas.

<<<<<<< HEAD
### Criar o banco vazio com Docker

Na raiz do repositório:
=======
   ```bash
   git clone <https://github.com/DesireeCost4/senai---futebol-.git>
   cd senai---futebol--main
   ```

2. Crie um arquivo `.env` a partir do modelo. Os valores padrão do
   Compose já permitem executar o projeto sem esse arquivo:
>>>>>>> 158fd39c289578ae416f46bef4aff826c11ab400

```bash
docker compose up -d mysql
docker compose ps mysql
```

O MySQL fica disponível em `localhost:3306` por padrão. O Compose monta somente
o `schema.sql`; o volume é inicializado uma única vez.

### Recriar o banco vazio do zero

Na raiz do repositório:

```bash
docker compose down -v
docker compose up -d mysql
docker compose ps mysql
```

O comando `down -v` remove o volume e o próximo `up` cria um banco novo,
vazio e com a estrutura do script versionado.

### Carregar dados de exemplo (opcional)

O arquivo [data.sql](./backend/src/main/resources/data.sql) é separado e não é
executado pela criação padrão. Para carregá-lo depois de criar o banco:

```bash
docker compose exec -T mysql mysql -u root -psecret db_senaiFut < backend/src/main/resources/data.sql
```

Se os valores do `.env` forem alterados, substitua `root`, `secret` e
`db_senaiFut` pelos valores configurados.

## 3. Instalar e executar no Ubuntu 24.04

Todos os comandos abaixo partem da raiz do repositório. A aplicação pode ser
executada integralmente com Docker ou manualmente.

### Opção A: Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

O banco começa vazio. Para executar o fluxo com dados de demonstração, em outro
terminal, a partir da raiz:

```bash
docker compose exec -T mysql mysql -u root -psecret db_senaiFut < backend/src/main/resources/data.sql
```

Endereços:

- Origem da API: <http://localhost:8080>
- Endpoint usado pela aplicação: <http://localhost:8080/api/v1>
- Frontend: <http://localhost:5173>
- Swagger: <http://localhost:8080/swagger-ui.html>

Para parar a aplicação:

```bash
docker compose down
```

Para parar e recriar também o banco vazio:

```bash
docker compose down -v
docker compose up --build
```

### Opção B: execução manual

#### Banco e backend

Com um servidor MySQL 8.4 disponível, execute na raiz:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS db_senaiFut CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p db_senaiFut < backend/src/main/resources/schema.sql
```

O banco criado está vazio. Para dados de exemplo, execute separadamente:

```bash
mysql -u root -p db_senaiFut < backend/src/main/resources/data.sql
```

Em um terminal, a partir da raiz:

```bash
export SPRING_DATASOURCE_URL='jdbc:mysql://localhost:3306/db_senaiFut'
export SPRING_DATASOURCE_USERNAME='root'
export SPRING_DATASOURCE_PASSWORD='SUA_SENHA'
cd backend
./mvnw spring-boot:run
```

#### Frontend

Em outro terminal, a partir da raiz:

```bash
cd frontend
npm ci
export VITE_API_BASE_URL='http://localhost:8080/api/v1'
npm run dev
```

O frontend estará em <http://localhost:5173>. A origem da API é
`http://localhost:8080`; o caminho `/api/v1` é acrescentado pela configuração
`VITE_API_BASE_URL`.

## 4. Variáveis de ambiente

O arquivo [`.env.example`](./.env.example) está versionado e pode ser copiado
para `.env`:

```bash
cp .env.example .env
```

Variáveis disponíveis:

| Variável | Finalidade | Padrão |
|---|---|---|
| `DB_NAME` | Nome do banco MySQL | `db_senaiFut` |
| `DB_ROOT_PASSWORD` | Senha do usuário root | `secret` |
| `DB_USER` | Usuário da aplicação | `senai` |
| `DB_PASSWORD` | Senha da aplicação | `12345` |
| `DB_PORT` | Porta publicada do MySQL | `3306` |
| `BACKEND_PORT` | Porta publicada da API | `8080` |
| `FRONTEND_PORT` | Porta publicada do frontend | `5173` |
| `VITE_API_BASE_URL` | URL completa da API usada pelo frontend | `http://localhost:8080/api/v1` |

O `.env` local não deve ser versionado.

## 5. Estrutura de pastas e bibliotecas

```text
.
├── backend/
│   ├── src/main/java/       # API, regras de negócio, modelos e persistência
│   ├── src/main/resources/  # configuração, schema.sql e data.sql opcional
│   ├── src/test/            # testes automatizados
│   ├── pom.xml              # dependências e plugins Java
│   └── mvnw                 # Maven Wrapper
├── frontend/
│   ├── src/components/      # componentes reutilizáveis
│   ├── src/pages/           # telas e rotas
│   ├── src/services/        # comunicação com a API
│   ├── src/utils/           # formatadores e utilitários
│   ├── package.json         # scripts e dependências
│   └── package-lock.json    # trava das dependências npm
├── compose.yaml              # MySQL, backend e frontend
├── .env.example              # configuração de ambiente
└── README.md                 # documentação da entrega
```

Bibliotecas principais:

- **Spring Boot:** inicialização e configuração da API.
- **Spring Web:** endpoints HTTP REST.
- **Spring Data JPA/Hibernate:** entidades e acesso ao banco.
- **MySQL Connector/J:** conexão Java com MySQL.
- **Spring Validation:** validação das entradas da API.
- **Springdoc OpenAPI:** documentação e Swagger.
- **H2:** banco isolado para o teste de contexto.
- **React:** construção da interface.
- **React Router:** navegação da aplicação.
- **TypeScript:** tipagem estática do frontend.
- **Axios:** chamadas HTTP para a API.
- **Lucide React:** ícones da interface.
- **Vite:** desenvolvimento e build do frontend.
- **Vitest:** testes frontend.
- **ESLint e Prettier:** análise e padronização do código.

## 6. Decisões e metas

- A rota `/` é a Home e qualquer rota desconhecida retorna para ela.
- A API usa a origem `http://localhost:8080` e o prefixo funcional `/api/v1`.
- O MySQL 8.4 é usado por ser a tecnologia definida para persistência.
- O banco padrão começa vazio; dados de demonstração são carregados somente por
  comando opcional.
- O backend concentra os cálculos de valor de mercado, taxas, multas,
  contratos, duelos e classificação.
- O frontend usa horário de Brasília para exibir datas ao usuário.
- A aplicação não possui autenticação porque login não faz parte do escopo
  anunciado.
- A meta é oferecer um fluxo reproduzível em máquina limpa, com validações
  explícitas e feedback de erro na interface e na API.

## 7. Funcionalidades não inovadoras

Não há funcionalidades não inovadoras adicionais a declarar. O projeto
implementa as funcionalidades básicas solicitadas: cadastro e mercado de
jogadores, clubes, contratos, transações, escalações, partidas, histórico e
classificação.

## 8. Uso de inteligência artificial

Foi utilizada inteligência artificial como apoio à análise do enunciado,
revisão de código, identificação de falhas de infraestrutura, melhoria da
documentação, criação de testes e validação dos comandos. Todas as alterações
foram revisadas no código do projeto e validadas com testes, lint, build,
Checkstyle e Docker Compose.

## Fluxo funcional

1. Acesse a Home em `/`.
2. Cadastre jogadores livres no mercado.
3. Cadastre clubes, cada um iniciado com 300,00 em caixa.
4. Compre jogadores com contrato de fidelidade.
5. Altere condição física, consulte contratos e venda jogadores.
6. Consulte o histórico e exporte as transações em CSV.
7. Monte escalações válidas com cinco titulares.
8. Jogue partidas entre clubes escalados.
9. Consulte histórico de partidas e classificação.

## Verificações

Frontend, na pasta `frontend`:

```bash
npm ci
npm run typecheck
npm run lint
npm run format
npm test
npm run build
```

Backend, na pasta `backend`:

```bash
./mvnw test
./mvnw checkstyle:check
```

Na raiz, valide o Compose com:

```bash
docker compose config
```

Os arquivos de trava usados na entrega são `frontend/package-lock.json`
(`lockfileVersion: 3`) e o Maven Wrapper (`backend/mvnw` com Maven 3.10.0).
