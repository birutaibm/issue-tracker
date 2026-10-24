# Issue Tracker MCP Server

A Model Context Protocol (MCP) server that provides file operations and database persistence for an issue tracker system. Allows AI agents to list files, read/write markdown files, and manage projects and cards through a SQLite database.

## Features

- **List files** - Browse directories and subdirectories in `~/issue-tracker`
- **Read markdown** - Read content of `.md` files
- **Write markdown** - Create or overwrite `.md` files
- **Database persistence** - SQLite database with Knex.js for projects and cards

## Tools

| Tool | Description |
|------|-------------|
| `list_files` | List files and directories (optional `path` parameter) |
| `read_markdown` | Read a `.md` file (requires `path`) |
| `write_markdown` | Create/overwrite a `.md` file (requires `path` and `content`) |

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

### Models

- **Project** (`src/db/models/project.ts`) - CRUD: `createProject`, `getProjectById`, `getProjectByPath`, `listProjects`, `updateProject`, `deleteProject`
- **Card** (`src/db/models/card.ts`) - CRUD: `createCard`, `getCardById`, `getCardByPath`, `listCards`, `updateCard`, `deleteCard`

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
    "issue-tracker": {
      "type": "local",
      "command": ["node", "/path/to/issue-tracker-mcp/dist/index.js"],
      "enabled": true
    }
  }
}
```

Then restart OpenCode. The tools will be available as `issue-tracker_*` (e.g., `issue-tracker_list_files`).

## Development

```bash
# Run in development mode (with tsx)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run migrations
npx knex migrate:latest --knexfile knexfile.ts

# Check migration status
npx knex migrate:status --knexfile knexfile.ts
```

## Project Structure

```
issue-tracker-mcp/
├── src/
│   ├── index.ts              # MCP server implementation
│   └── db/
│       ├── config.ts         # Knex configuration
│       ├── client.ts         # Knex singleton instance
│       ├── index.ts          # Database exports
│       ├── migrations/       # Database migrations
│       │   ├── 20261024000001_create_projects.ts
│       │   └── 20261024000002_create_cards.ts
│       └── models/
│           ├── project.ts    # Project CRUD operations
│           └── card.ts       # Card CRUD operations
├── dist/                     # Compiled output (gitignored)
├── knexfile.ts              # Knex CLI configuration
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Data Directory

The MCP operates on `~/issue-tracker/` which contains:
- `projects/` - Project directories with cards
- `cards/` - Individual issue cards as markdown files
- `.data/` - SQLite database (`database.sqlite`)

## License

ISC