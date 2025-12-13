<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

📚 RAG Bot (PDF & Web-based Retrieval-Augmented Generation)

A production-ready Retrieval-Augmented Generation (RAG) system built with NestJS, Qdrant, MongoDB, and Ollama.
It supports querying structured knowledge extracted from PDF documents and web articles (e.g. Medium) using vector search.

## Features

✅ PDF ingestion & semantic search

✅ Web article ingestion (Medium, blogs, docs)

✅ Vector embeddings using Ollama

✅ Qdrant vector database

✅ Session-based conversational memory

✅ Context-limited, hallucination-safe RAG

✅ Streaming LLM responses

✅ Strong prompt discipline (TOON-ready)

✅ Type-safe, modular NestJS architecture

## High-Level Architecture
Data Source (PDF / URL)
        ↓
Text Extraction
        ↓
Chunking (with overlap)
        ↓
Embeddings (Ollama)
        ↓
Vector Storage (Qdrant)
        ↓
Similarity Search
        ↓
Context Construction
        ↓
LLM (Ollama)
        ↓
Answer (Grounded in source)

## Tech Stack
| Layer       | Technology                    |
| ----------- | ----------------------------- |
| API         | NestJS                        |
| Vector DB   | Qdrant                        |
| Database    | MongoDB                       |
| LLM         | Ollama                        |
| Embeddings  | nomic-embed-text              |
| PDF Parsing | Custom PDF parser             |
| Web Parsing | Readability / HTML extraction |

## Project Structure
src/
├── chat/                # Chat & RAG logic
|   ├── chat.module.ts
│   ├── chat.service.ts
│   ├── chat.controller.ts
│   └── entities/
├── pdf/                 # PDF ingestion pipeline
|   ├── pdf.module.ts
│   ├── pdf.service.ts
|   ├── pdf.controller.ts
│   └── entities/
├── qdrant/              # Vector DB abstraction
|   ├── qdrant.module.ts
│   └── qdrant.service.ts
├── shared/
|   ├── shared.module.ts
│   ├── chunk.service.ts
│   ├── embeddings.service.ts
│   └── pdf-parser.service.ts
└── common/
    └── constants/

##  RAG Query Flow
User sends a question

Query is embedded

Top-K relevant chunks retrieved from Qdrant

Context is capped (MAX_CONTEXT_CHARS)

Prompt is built with:

PDF / URL context

Limited conversation history

Ollama generates a grounded answer

Response is streamed back to the client

