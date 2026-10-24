# Issue Tracker MCP Server

A Model Context Protocol (MCP) server that provides file operations for an issue tracker system. Allows AI agents to list files, read markdown files, and create new markdown files in the `~/issue-tracker` directory.

## Features

- **List files** - Browse directories and subdirectories in `~/issue-tracker`
- **Read markdown** - Read content of `.md` files
- **Write markdown** - Create or overwrite `.md` files

## Tools

| Tool | Description |
|------|-------------|
| `list_files` | List files and directories (optional `path` parameter) |
| `read_markdown` | Read a `.md` file (requires `path`) |
| `write_markdown` | Create/overwrite a `.md` file (requires `path` and `content`) |

## Installation

```bash
# Clone and install dependencies
cd issue-tracker-mcp
npm install

# Build TypeScript
npm run build
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
```

## Project Structure

```
issue-tracker-mcp/
├── src/
│   └── index.ts          # MCP server implementation
├── dist/                 # Compiled output (gitignored)
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Data Directory

The MCP operates on `~/issue-tracker/` which contains:
- `projects/` - Project directories with cards
- `cards/` - Individual issue cards as markdown files
- `.data/` - SQLite database (for future persistence layer)

## License

ISC