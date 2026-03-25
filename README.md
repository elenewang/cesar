# Updates on new implementations

## 1. MCP Server
A MCP Server has been added to expose the property estimation model as a tool for Claude Desktop or Cursor. 
It allows Claude Desktop or AI assistants to call the model during a conversation without seeing the API or UI 
and creates another entry point to access the estimation model.

The MCP server is located in `runtime/mcp_server/server.py`

## How to connect to Claude Desktop or Cursor
Add this to ~/Library/Application Support/Claude/claude_desktop_config.json or to ~/.cursor/mcp.json:

{
  "mcpServers": {
    "property-estimator": {
      "command": "/path/to/your/.venv/bin/python",
      "args": ["/path/to/cesar/runtime/mcp_server/server.py"]
    }
  }
}
