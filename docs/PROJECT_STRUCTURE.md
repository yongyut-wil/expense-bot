# Project Structure

This document outlines the file and folder structure of the Expense Bot project.

## Root Directory

```text
expense-bot/
├── .dockerignore           # Docker ignore patterns
├── .env                    # Environment variables (not in git)
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore patterns
├── CHANGELOG.md            # Version history and changes
├── Dockerfile              # Docker container configuration
├── LICENSE                 # Project license
├── README.md               # Project overview and documentation
├── docker-compose.yml      # Docker Compose configuration
├── jest.config.ts          # Jest testing configuration
├── package.json            # Node.js dependencies and scripts
├── package-lock.json       # Locked dependency versions
├── tsconfig.json           # TypeScript compiler configuration
│
├── docs/                   # Documentation files
├── prisma/                 # Database schema and migrations
└── src/                    # Source code
```

## Documentation (`docs/`)

```text
docs/
├── ARCHITECTURE.md         # System architecture overview
├── CONTRIBUTING.md         # Contribution guidelines
├── DESIGN_DECISIONS.md     # Design decisions and rationale
├── DOCKER.md               # Docker setup and usage
├── PROJECT_STRUCTURE.md    # This file
└── SETUP_GUIDE.md          # Setup instructions
```

## Database (`prisma/`)

```text
prisma/
├── schema.prisma           # Prisma database schema
└── migrations/             # Database migration files
    ├── 20260323102815_init/
    └── migration_lock.toml
```

## Source Code (`src/`)

```text
src/
├── index.ts                # Application entry point
├── app.ts                  # Express application setup
│
├── config/                 # Configuration
│   └── index.ts            # Centralized config management
│
├── db/                     # Database clients
│   └── prisma.ts           # Prisma client with singleton, logging, monitoring
│
├── types/                  # TypeScript type definitions
│   └── index.ts            # Global type definitions
│
├── middleware/             # Express middleware
│   ├── errorHandler.ts     # Global error handling
│   ├── lineSignature.ts    # LINE webhook signature validation
│   └── security.ts         # Security headers and rate limiting
│
├── handlers/               # Request handlers
│   └── message.ts          # LINE message event handlers
│
├── services/               # Business logic
│   ├── index.ts            # Service exports
│   ├── expense.ts          # Expense management service
│   ├── fallback.ts         # Fallback parsing service
│   ├── google.ts           # Google Sheets integration
│   ├── line.ts             # LINE Messaging API service
│   ├── types.ts            # Service-specific types
│   └── ai/                 # AI-related services
│       └── prompt.ts       # AI prompt templates
│
├── utils/                  # Utility functions
│   ├── errors.ts           # Custom error classes
│   └── logger.ts           # Logging utilities
│
├── generated/              # Generated code
│   └── prisma/             # Prisma generated client
│
└── __tests__/              # Test files
    ├── __mocks__/          # Test mocks
    │   ├── google.ts       # Google Sheets mock
    │   ├── line.ts         # LINE API mock
    │   └── prisma.ts       # Prisma client mock
    │
    ├── handlers/           # Handler tests
    │   └── message.test.ts
    │
    ├── middleware/         # Middleware tests
    │   ├── errorHandler.test.ts
    │   ├── lineSignature.test.ts
    │   └── security.test.ts
    │
    └── services/           # Service tests
        ├── expense.test.ts
        ├── fallback.test.ts
        ├── google.test.ts
        ├── line.test.ts
        └── parseExpense.test.ts
```

## Key Components

### Application Flow

1. **Entry Point** (`index.ts`) - Starts the server
2. **App Setup** (`app.ts`) - Configures Express with middleware
3. **Middleware Layer** - Security, validation, error handling
4. **Handlers** - Process incoming LINE webhook events
5. **Services** - Business logic for expense tracking, AI parsing, external APIs
6. **Database** - Prisma ORM for data persistence

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest
- **External APIs**: LINE Messaging API, Google Sheets API
- **Deployment**: Docker

### Testing Structure

- **Unit Tests**: All services, handlers, and middleware
- **Mocks**: External dependencies (LINE, Google, Prisma)
- **Coverage**: Configured with Jest

### Configuration Management

- Environment variables via `.env`
- Centralized config in `src/config/index.ts`
- Type-safe configuration with TypeScript

---

**Last Updated**: March 25, 2026
