# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tech Post Cast is a monorepo AI-powered podcast generation service that creates daily tech podcasts from Qiita articles. The system supports both public content and personalized subscription-based program generation.

## Essential Commands

### Development
```bash
# Start development servers
yarn start:api-backend      # API Backend (port 3001)
yarn start:backend          # Content generation backend (port 3000) 
yarn start:lp-frontend      # Landing page frontend
yarn start:line-bot         # LINE Bot development

# Database operations
yarn generate-prisma       # Generate Prisma client
yarn deploy-migration-prisma # Apply database migrations
yarn seed-prisma          # Seed database with sample data
```

### Building
```bash
# Build individual apps
yarn build:api-backend     # Build API backend
yarn build-backend         # Build content generation backend
yarn build:lp-frontend     # Build landing page frontend

# Build with dependencies
yarn build-for-backend     # Build commons + database + backend
yarn build:for-api-backend # Build commons + database + api-backend
```

### Testing
```bash
yarn test                  # Run all tests
yarn test-backend          # Test backend only
yarn test-commons          # Test commons package
yarn test-database         # Test database package
```

### API Documentation
```bash
yarn generate:api-spec     # Generate all API specs
yarn generate:api-client   # Generate API client from specs
```

## Architecture Overview

### Repository Structure
- **apps/**: Main applications
  - `api-backend/`: User-facing REST API (NestJS)
  - `backend/`: Content generation API (NestJS) 
  - `lp-frontend/`: Landing page & dashboard (Nuxt3)
  - `liff-frontend/`: LINE LIFF app (Nuxt3)
  - `line-bot/`: LINE Bot (Hono on Cloudflare Workers)
  - `infra/`: AWS CDK infrastructure (deprecated)
- **packages/**: Shared packages
  - `database/`: Prisma schema and client
  - `commons/`: Shared utilities

### Technology Stack
- **Backend**: NestJS, PostgreSQL with Prisma, Clerk Auth
- **Frontend**: Nuxt3, Vue3, Vuetify, TypeScript
- **AI/ML**: OpenAI, Google AI, Mastra framework
- **Infrastructure**: AWS Cloud Run, CloudFront, RDS
- **Storage**: AWS S3, Cloudflare R2

## Critical Implementation Patterns

### NestJS Repository Pattern (Mandatory)

Always implement the repository pattern with interfaces:

```typescript
// 1. Domain interface (src/domains/{domain}/{domain}.repository.interface.ts)
export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
}

// 2. Infrastructure implementation (src/infrastructure/database/{domain}/{domain}.repository.ts)
@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private prisma: PrismaService) {}
  // Implementation
}

// 3. DI configuration in module
providers: [
  {
    provide: 'UsersRepository',
    useClass: UsersRepository,
  },
]

// 4. Service injection
constructor(
  @Inject('UsersRepository')
  private readonly repository: IUsersRepository,
) {}
```

### Test Data Management (Mandatory)

Always use factory classes for test data - never create inline test objects:

```typescript
// Create factory class (src/test/factories/{entity}.factory.ts)
export class UserFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides,
    };
  }
}

// Use in tests
const user = UserFactory.createUser({ name: 'Custom Name' });
```

### Directory Structure Standards

```
src/
├── domains/                    # Domain layer with interfaces
│   └── {domain}/
│       ├── {domain}.repository.interface.ts
│       └── {domain}.service.ts
├── infrastructure/             # Infrastructure implementations
│   └── database/
│       └── {domain}/
│           └── {domain}.repository.ts
├── controllers/               # API controllers with DTOs
├── test/
│   └── factories/            # Test data factories
└── types/
    └── errors/              # Custom error types
```

## Development Guidelines

### TypeScript Standards
- Use strict mode (`strict: true`)
- Explicit return types for all functions
- No `any` types - define explicit types
- Comprehensive error handling

### Testing Requirements
- Use factory classes for all test data
- Mock external dependencies with `jest-mock-extended`
- Follow Arrange-Act-Assert pattern
- Test both success and error scenarios

### API Design
- Use DTOs for request/response validation
- Implement OpenAPI documentation with `@nestjs/swagger`
- Resource ownership validation for user data
- Consistent error responses

### Frontend Patterns (Nuxt3)
- Use Composition API with TypeScript
- Domain-specific composables for API calls
- Progressive loading with proper error states
- Vuetify for UI components

## Key Database Entities

- `AppUser`: Clerk-integrated user management
- `PersonalizedFeed`: User-defined content filters with Qiita integration
- `HeadlineTopicProgram`: Daily generated podcast episodes
- `QiitaPost`: Sourced articles with AI-generated summaries
- `Subscription`: Stripe-integrated billing and feature access

## Branch Naming
- Features: `feature/TPC-XXX` or `feature/description`
- Fixes: `fix/TPC-XXX` or `fix/description`
- Refactoring: `refactor/description`

## Important Notes

- The codebase uses Yarn workspaces - always run commands from root
- Database uses PostgreSQL with vector extensions for AI embeddings
- Content generation involves complex AI workflows with Mastra
- Authentication is handled via Clerk across all applications
- Repository pattern implementation is mandatory for all data access
- Test factory usage is mandatory - no inline test data objects