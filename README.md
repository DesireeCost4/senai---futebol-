# Passe - Gestão da liga

Aplicação fullstack para gerenciar jogadores, clubes, transferências, contratos,
escalações, partidas e classificação de uma liga fictícia.

## Stack

- **Backend:** Java 21, Spring Boot, Spring Data JPA, MySQL e Maven.
- **Frontend:** React 18, TypeScript, Vite, React Router e Axios.
- **Infraestrutura:** Docker Compose com MySQL, API e frontend.
- **Documentação da API:** Swagger UI em `/swagger-ui.html`.

## Passo a passo para subir o projeto

### Opção recomendada: Docker Compose

Pré-requisitos: Docker Engine e Docker Compose V2.

1. Clone o repositório e entre na pasta do projeto:

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd senai---futebol--main
   ```

2. (Opcional) crie um arquivo `.env` a partir do modelo. Os valores padrão do
   Compose já permitem executar o projeto sem esse arquivo:

   ```bash
   cp .env.example .env
   ```

3. Construa as imagens e suba MySQL, backend e frontend:

   ```bash
   docker compose up --build
   ```

4. Aguarde o healthcheck do MySQL e acesse:

   - Interface: <http://localhost:5173>
   - API: <http://localhost:8080/api/v1>
   - Swagger: <http://localhost:8080/swagger-ui.html>

5. Para parar os containers, use `Ctrl+C` ou, em outro terminal:

   ```bash
   docker compose down
   ```

6. Para recriar o banco e reaplicar `schema.sql` e `data.sql`:

   ```bash
   docker compose down -v
   docker compose up --build
   ```

O volume do MySQL é inicializado apenas na primeira criação. Não use
`docker compose down -v` se quiser preservar os dados locais.

O backend inicializa `schema.sql` e `data.sql` automaticamente quando o banco
está vazio. As portas, credenciais e URL da API podem ser alteradas no `.env`, usando
[.env.example](./.env.example) como referência. O `.env` local não deve ser
versionado.

### Opção alternativa: execução manual

### Banco

1. Instale e inicie um MySQL. Crie o banco `db_senaiFut` e um usuário com
   permissão de acesso, ou use as credenciais equivalentes nas variáveis de
   ambiente.

2. Aplique os scripts de estrutura e dados:

   ```bash
   mysql -u senai -p db_senaiFut < backend/src/main/resources/schema.sql
   mysql -u senai -p db_senaiFut < backend/src/main/resources/data.sql
   ```

3. Em um terminal, configure o banco e inicie o backend:

```bash
export SPRING_DATASOURCE_URL='jdbc:mysql://localhost:3306/db_senaiFut'
export SPRING_DATASOURCE_USERNAME='senai'
export SPRING_DATASOURCE_PASSWORD='12345'
cd backend
./mvnw spring-boot:run
```

Variáveis aceitas pelo backend:

- `SERVER_PORT`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `CORS_ORIGINS`

4. Em outro terminal, instale as dependências e inicie o frontend:

```bash
cd frontend
npm ci
npm run dev
```

Por padrão, o frontend usa `http://localhost:8080/api/v1`. Para apontar para
outra API, defina `VITE_API_BASE_URL` antes de `npm run dev`.

## Verificações

Frontend (na pasta `frontend`):

```bash
cd frontend
npm ci
npm run typecheck
npm run lint
npm run format
npm test
npm run build
```

Backend (na pasta `backend`):

```bash
cd backend
./mvnw test
./mvnw checkstyle:check
```

Validação adicional da configuração Docker:

```bash
docker compose config
```

O teste de componente de `HomePage` é executado junto com `npm test`, além dos
testes de formatação. O schema SQL também aplica restrições de domínio para
evitar registros inválidos mesmo quando a inserção não passa pela API.

Os testes são executados uma vez e terminam sem modo de observação. A suíte
backend inclui testes do cálculo do valor de mercado e das regras de mercado.
O Checkstyle verifica a consistência mínima dos arquivos Java sem alterar o
código.

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

## API

Todos os endpoints estão sob `/api/v1` e são descritos interativamente no
Swagger. As mensagens de erro usam o formato JSON com o campo `message`.
Requisições são registradas pelo backend com método, caminho, status e duração.

## Funcionalidades não implementadas

Não há funcionalidades obrigatórias conhecidas pendentes. Recursos de
autenticação/login não fazem parte do enunciado e, portanto, não foram
implementados.

## Histórico e uso de IA

O desenvolvimento mantém histórico de commits no Git. Ferramentas de IA foram
utilizadas como apoio à revisão, refatoração e validação; as alterações foram
revisadas no código do projeto.
