# ⚽ Desafio Técnico ISI - Sistema de Gerenciamento de Futebol

Sistema backend desenvolvido em Java com Spring Boot para o gerenciamento de clubes, jogadores, mercado de transferências, escalações e simulação de partidas de futebol, seguindo estritamente as regras de negócio e convenções de API estabelecidas.

--- 

##  Tecnologias Utilizadas

* **Java 21**
* **Spring Boot** (Web, Data JPA, Validation)
* **MySQL** (Banco de dados relacional)
* **Docker & Docker Compose** (Orquestração do ambiente)
* **Maven** (Gerenciamento de dependências)

##  Pré-requisitos

* Certifique-se de ter instalado na sua máquina:
* Java JDK 21
* Docker e Docker Compose
* Maven

## Como Executar o Projeto

### 1. Subir o Banco de Dados com Docker

Na raiz do projeto (onde está o ficheiro compose.yaml), execute:
```bash
docker compose up -d 
```

### 2. Executar a Aplicação Backend

Navegue até a pasta do backend e execute a aplicação via Maven:
```bash
cd backend
./mvnw spring-boot:run
```

A API estará disponível em http://localhost:8080/api/v1.

##  Executando os Testes Automatizados

Para rodar a suíte de testes unitários e de integração implementada:
```bash
cd backend
./mvnw test
```

## Uso de Inteligência Artificial

Em conformidade com as diretrizes do desafio, ferramentas de Inteligência Artificial foram utilizadas como apoio complementar no auxílio à refatoração de código, padronização e revisão. Todo o código consultado foi auditado, testado e validado manualmente.