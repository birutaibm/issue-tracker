# Issue Tracker MCP Server

A Model Context Protocol (MCP) server that provides database persistence for an issue tracker system. Allows AI agents to manage projects and cards through a SQLite database with associated markdown content.

Now includes an **Express HTTP server + Vue 3 frontend** for web-based access to the same data.

## Features

- **Read card** - Get card data from the database together with its markdown content and comments
- **Create project** - Create new projects in the issue tracker
- **Create card** - Create new cards within a project
- **List projects** - List all projects
- **List cards** - List all cards in a specific project
- **Add comment** - Add comments to cards (stored in database + markdown files)
- **Delete comment** - Delete a comment (database record + markdown file)
- **Delete card** - Delete a card (comments, markdown file, and assets folder)
- **Delete project** - Delete a project (cards, comments, project folder, and database records)
- **Database persistence** - SQLite database with Knex.js for projects, cards, and comments
- **HTTP API** - RESTful API for all CRUD operations
- **Vue 3 Frontend** - Web interface for managing projects, cards, and comments
- **Advanced Markdown** - Syntax highlighting (Shiki) including Vue SFCs and unknown-language fallback, code blocks, Mermaid diagrams, task lists, image serving

## Tools (MCP)

| Tool | Description |
|------|-------------|
| `read_card` | Get card data + markdown content + comments (requires `card_id` or `card_path`) |
| `create_project` | Create a new project (requires `title`) |
| `create_card` | Create a new card in a project (requires `project_id`, `title`, `description`) |
| `list_projects` | List all projects |
| `list_cards` | List all cards in a project (requires `project_id`) |
| `add_comment` | Add a comment to a card (requires `card_id`, `content`) |

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project with card summary |
| PATCH | `/api/projects/:id` | Update project title |
| GET | `/api/projects/:id/cards` | List cards in project |
| POST | `/api/projects/:id/cards` | Create card |
| GET | `/api/cards/:id` | Get card with content + comments |
| PATCH | `/api/cards/:id` | Update card (title, status, content) |
| DELETE | `/api/cards/:id` | Delete card |
| GET | `/api/cards/:id/comments` | List comments |
| POST | `/api/cards/:id/comments` | Add comment |
| DELETE | `/api/cards/:cardId/comments/:id` | Delete comment |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:projectSlug/assets/:cardSlug/:filename` | Serve image/file |

## Database

The server includes a persistence layer using **Knex.js + SQLite**:

### Tables

**`projects`**
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `title` | TEXT | NOT NULL |
| `path` | TEXT | NOT NULL, UNIQUE |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

**`cards`**
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `title` | TEXT | NOT NULL |
| `path` | TEXT | NOT NULL |
| `status` | TEXT | NOT NULL, DEFAULT 'todo' ('todo', 'in_progress', 'done') |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY REFERENCES projects(id) |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

**`comments`**
| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `card_id` | INTEGER | NOT NULL, FOREIGN KEY REFERENCES cards(id) ON DELETE CASCADE |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

**Note**: Comment content is NOT stored in the database. It is stored as markdown files in `projects/{project-slug}/cards/{card-slug}/comments/{comment-id}.md`

### Models

- **Project** (`src/db/models/project.ts`) - CRUD: `createProject`, `getProjectById`, `getProjectByPath`, `listProjects`, `updateProject`, `deleteProject`
- **Card** (`src/db/models/card.ts`) - CRUD: `createCard`, `getCardById`, `getCardByPath`, `listCards`, `updateCard`, `deleteCard`
- **Comment** (`src/db/models/comment.ts`) - CRUD: `createComment`, `getCommentsByCardId`, `deleteComment`

### Database Location

`~/issue-tracker/.data/database.sqlite`

## Installation

```bash
# Clone and install dependencies
cd issue-tracker-mcp
npm install

# Build TypeScript
npm run build

# Run migrations
npx knex migrate:latest --knexfile knexfile.ts
```

## Usage with OpenCode

Add to your OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "issue-tracker": {
        "type": "remote",
        "url": "http://localhost:3000/mcp"
      }
    }
  }
}
```

For Docker/container environments, use `host.docker.internal`:
```json
{
  "mcp": {
    "servers": {
      "issue-tracker": {
        "type": "remote",
        "url": "http://host.docker.internal:3000/mcp"
      }
    }
  }
}
```

Then restart OpenCode. The tools will be available as `issue-tracker_*` (e.g., `issue-tracker_read_card`).

**Note**: The MCP endpoint uses Streamable HTTP with session cookies. OpenCode's remote client will automatically handle session persistence via cookies.

## HTTP Server + MCP

The server runs both **MCP (Streamable HTTP at /mcp)** and **HTTP REST API (port 3000)** in the same process:

```bash
# Development (both servers with hot reload)
npm run dev

# Production build
npm run build

# Run production (serves both MCP and HTTP)
npm start
```

The Vue frontend will be available at `http://localhost:3000` (serves static files from `dist/client/`).
The MCP endpoint is available at `http://localhost:3000/mcp` (stateful Streamable HTTP transport with cookie-based session persistence).

## Development

```bash
# Run in development mode (both MCP + Express + Vite)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run migrations
npx knex migrate:latest --knexfile knexfile.ts

# Check migration status
npx knex migrate:status --knexfile knexfile.ts

# Lint code
npm run lint

# Fix lint errors automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run unit/integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests (Playwright starts the server automatically)
npx playwright test
```

## Project Structure

```
issue-tracker-mcp/
├── src/
│   ├── index.ts              # Main entry (MCP + Express)
│   ├── http/                 # Express HTTP server
│   │   ├── index.ts          # Express app factory
│   │   ├── router.ts         # Route aggregator
│   │   ├── middleware/       # Error handler, request logger
│   │   ├── controllers/      # Project, Card, Comment, Asset controllers
│   │   └── routes/           # Route definitions
│   ├── services/             # Shared services layer
│   │   ├── FileSystem.ts     # File system operations
│   │   ├── projectService.ts # Project business logic
│   │   ├── cardService.ts    # Card business logic
│   │   ├── commentService.ts # Comment business logic
│   │   └── assetService.ts   # Asset serving
│   ├── tools/                # MCP tool implementations
│   │   ├── CardReader.ts     # Read card tool
│   │   ├── CardCreator.ts    # Create card tool
│   │   ├── CardLister.ts     # List cards tool
│   │   ├── ProjectCreator.ts # Create project tool
│   │   ├── ProjectLister.ts  # List projects tool
│   │   ├── CommentAdder.ts   # Add comment tool
│   │   └── index.ts          # Tool registry
│   ├── db/
│   │   ├── config.ts         # Knex configuration
│   │   ├── client.ts         # Knex singleton instance
│   │   ├── index.ts          # Database exports
│   │   ├── migrations/       # Database migrations
│   │   │   ├── 20261024000001_create_projects.ts
│   │   │   ├── 20261024000002_create_cards.ts
│   │   │   └── 20261024000003_create_comments.ts
│   │   └── models/
│   │       ├── project.ts    # Project CRUD operations
│   │       ├── card.ts       # Card CRUD operations
│   │       └── comment.ts    # Comment CRUD operations
│   ├── shared/
│   │   └── types.ts          # Shared TypeScript types
│   └── __tests__/            # Test utilities and setup
│       ├── test-utils.ts     # Test environment setup
│       └── test-db.ts        # Test database helpers
├── client/                   # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── main.ts           # App entry
│   │   ├── App.vue           # Root component
│   │   ├── router.ts         # Vue Router
│   │   ├── api/client.ts     # Axios API client
│   │   ├── stores/           # Pinia stores (projects, cards, UI)
│   │   ├── views/            # Page components (shared types come from @shared)
│   │   └── components/       # Reusable components
│   │       ├── MarkdownRenderer/  # Advanced markdown (Shiki, Mermaid, tasks)
│   │       └── ...
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── dist/                     # Compiled output (gitignored)
│   ├── index.js              # Server bundle
│   └── client/               # Vue build output
├── knexfile.ts              # Knex CLI configuration
├── package.json
├── tsconfig.json
├── jest.config.mjs          # Jest configuration
├── .gitignore
└── README.md
```

## Testing

The project includes comprehensive automated tests using **Jest** with **ts-jest**:

- **183 unit/integration tests** covering all models, tools, and services
- **14 E2E tests** (Playwright) covering critical user flows:
  - Create project → create card → add comment
  - Comment Markdown rendering (bold, inline code)
  - Markdown rendering: code blocks with syntax highlighting
  - Markdown rendering: code blocks with horizontal scrolling for long lines
  - Markdown rendering: Vue and unknown code languages
  - Markdown rendering: Mermaid diagrams
  - Markdown rendering: task lists (checked/unchecked)
  - Card status updates (todo → in_progress → done)
  - Delete comment
  - Delete card
  - Delete project
  - Image asset serving
  - Navigation (back to projects list)
  - Project card counts update
- **87%+ code coverage** (statements, branches, functions, lines)
- **In-memory SQLite** for fast, isolated test execution
- Run `npm test` to execute all tests
- Run `npm run test:coverage` for detailed coverage report

## Data Directory

The MCP operates on `~/issue-tracker/` which contains:
- `projects/` - Project directories with cards
- `cards/` - Individual issue cards as markdown files
- `.data/` - SQLite database (`database.sqlite`)

### Comments File Structure

Comments are stored as markdown files in:
```
projects/{project-slug}/cards/{card-slug}/comments/{comment-id}.md
```

## License

ISC