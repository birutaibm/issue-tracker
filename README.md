# Issue Tracker MCP Server

A Model Context Protocol (MCP) server that provides database persistence for an issue tracker system. Allows AI agents to manage projects and cards through a SQLite database with associated markdown content.

## Features

- **Read card** - Get card data from the database together with its markdown content and comments
- **Create project** - Create new projects in the issue tracker
- **Create card** - Create new cards within a project
- **List projects** - List all projects
- **List cards** - List all cards in a specific project
- **Add comment** - Add comments to cards (stored in database + markdown files)
- **Database persistence** - SQLite database with Knex.js for projects, cards, and comments

## Tools

| Tool | Description |
|------|-------------|
| `read_card` | Get card data + markdown content + comments (requires `card_id` or `card_path`) |
| `create_project` | Create a new project (requires `title`) |
| `create_card` | Create a new card in a project (requires `project_id`, `title`, `description`) |
| `list_projects` | List all projects |
| `list_cards` | List all cards in a project (requires `project_id`) |
| `add_comment` | Add a comment to a card (requires `card_id`, `content`) |

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
- **Comment** (`src/db/models/comment.ts`) - CRUD: `createComment`, `getCommentsByCardId`

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

Then restart OpenCode. The tools will be available as `issue-tracker_*` (e.g., `issue-tracker_read_card`).

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

# Lint code
npm run lint

# Fix lint errors automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

## Project Structure

```
issue-tracker-mcp/
├── src/
│   ├── index.ts              # MCP server implementation
│   ├── tools/                # Tool implementations
│   │   ├── CardReader.ts     # Read card tool
│   │   ├── CardCreator.ts    # Create card tool
│   │   ├── CardLister.ts     # List cards tool
│   │   ├── ProjectCreator.ts # Create project tool
│   │   ├── ProjectLister.ts  # List projects tool
│   │   ├── CommentAdder.ts   # Add comment tool
│   │   └── index.ts          # Tool registry
│   ├── services/
│   │   └── FileSystem.ts     # File system operations
│   └── db/
│       ├── config.ts         # Knex configuration
│       ├── client.ts         # Knex singleton instance
│       ├── index.ts          # Database exports
│       ├── migrations/       # Database migrations
│       │   ├── 20261024000001_create_projects.ts
│       │   ├── 20261024000002_create_cards.ts
│       │   └── 20261024000003_create_comments.ts
│       └── models/
│           ├── project.ts    # Project CRUD operations
│           ├── card.ts       # Card CRUD operations
│           └── comment.ts    # Comment CRUD operations
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

### Comments File Structure

Comments are stored as markdown files in:
```
projects/{project-slug}/cards/{card-slug}/comments/{comment-id}.md
```

## License

ISC