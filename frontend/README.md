# Passe Frontend

Frontend React + TypeScript para o sistema de gerenciamento de futebol.

## Pré-requisitos

- Node.js 18.19 ou superior e npm 9 ou superior.
- Backend disponível em `http://localhost:8080`.

## Instalação e execução

```bash
npm ci
npm run dev
```

A interface fica disponível em `http://localhost:5173`. A API base é `http://localhost:8080/api/v1`.

## Verificações

```bash
npm run typecheck
npm run lint
npm run format
npm test
npm run build
```

`npm test` executa Vitest uma vez e termina sem modo watch. `npm run format` apenas verifica a formatação.

## Ferramentas

- React e React Router: interface e navegação por rotas.
- TypeScript: contratos e validação estática do frontend.
- Axios: comunicação com a API.
- Lucide React: ícones da interface.
- Vitest: teste unitário de formatação.
- ESLint com typescript-eslint: análise estática do código.
- Prettier: verificação de formatação.
