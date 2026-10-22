# Passe - Gestão da liga

Aplicação fullstack para gerenciar jogadores, clubes, transferências, contratos,
escalações, partidas e classificação de uma liga fictícia.

## Stack

- **Backend:** Java 21, Spring Boot, Spring Data JPA, MySQL e Maven.
- **Frontend:** React 18, TypeScript, Vite, React Router e Axios.
- **Infraestrutura:** Docker Compose com MySQL, API e frontend.
- **Documentação da API:** Swagger UI em `/swagger-ui.html`.

## Executar tudo com Docker

Pré-requisitos: Docker com Compose V2.

1. (Opcional) copie as configurações de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Suba banco, backend e frontend:

   ```bash
   docker compose up --build
   ```

3. Acesse:

   - Interface: <http://localhost:5173>
   - API: <http://localhost:8080/api/v1>
   - Swagger: <http://localhost:8080/swagger-ui.html>

O backend inicializa `schema.sql` e `data.sql` automaticamente quando o banco
está vazio. Para recriar o banco do zero:

```bash
docker compose down -v
docker compose up --build
```

As portas, credenciais e URL da API podem ser alteradas no `.env`, usando
[.env.example](./.env.example) como referência. O `.env` local não deve ser
versionado.

## Executar sem Docker

### Banco

É necessário um MySQL com o banco `db_senaiFut`, usuário `senai` e senha
`12345`, ou as credenciais equivalentes definidas por variáveis de ambiente.

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Variáveis aceitas pelo backend:

- `SERVER_PORT`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `CORS_ORIGINS`

### Frontend

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Para apontar para outra API, defina `VITE_API_BASE_URL` antes do comando de
desenvolvimento.

## Verificações

Frontend:

```bash
cd frontend
npm ci
npm run typecheck
npm run lint
npm run format
npm test
npm run build
```

Backend:

```bash
cd backend
./mvnw test
./mvnw checkstyle:check
```

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
