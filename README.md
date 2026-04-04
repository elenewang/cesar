# CESAR -Property Valuation System
CESAR is a modular system to manage the lifecycle of a property valuation model. CESAR enables stakeholders to estimate real estate values via a Web UI and MCP hosts such as Claude Desktop.

---

## Key Capabilities

- **Quantile Regression**: Unlike standard models that provide point estimates, CESAR estimates the 25th, 50th, and 75th percentiles. This provides a valuation range that allows     stakeholders to see the model’s confidence level for any given property.

- **Interactive UI**: A dynamic map-based interface that allows users to select departments visually.

- **MCP Server**: The model is exposed to AI Agents such as Claude Desktop and Cursor. This allows users to perform property valuations directly within their AI chat or coding environment.

---
## How to run


### 1. Prerequisites

- Python 3.11+
- Node 20+ (for the UI)

### 2. Install

Dependencies are declared in `pyproject.toml` (the modern replacement for `requirements.txt`). Use `pip install -e .` 

```bash
pip install -e .
cd runtime/rating_ui && npm ci
```

---
## How it works

### 1. Data & Training

### 2. Model serving 

```bash
uvicorn runtime.prediction_api.app:app --reload --host 0.0.0.0 --port 8000
```
Set `CESAR_MODEL_PATH` and `CESAR_CONTRACT_PATH` in the environment.


### 3. How to access estimates

---

Estimates can be retrieved through three channels depending on your use case.


**Web UI** 

Best for end-users, easy to use interface

```bash
cd runtime/rating_ui && npm run dev
```

Open http://localhost:5173. Select a department on the interactive map of France,
fill in the property details, and submit. The response displays the estimated
value range in real time.

---

**MCP Host (Claude Desktop, Cursor)** 

Best for agentic workflows

An MCP server exposes the property estimation model as a native tool for Claude
Desktop and Cursor. AI assistants can call the model mid-conversation without
any knowledge of the underlying API or UI.

The server is located at `runtime/mcp_server/server.py`.

Add the following to your client's config file:
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Cursor: `~/.cursor/mcp.json`
```json
{
  "mcpServers": {
    "property-estimator": {
      "command": "/path/to/your/.venv/bin/python",
      "args": ["/path/to/cesar/runtime/mcp_server/server.py"]
    }
  }
}
```

Once connected, `get_property_estimate` appears as a tool in your AI environment.
No API calls or UI interaction required.

---

**Batch CLI** 

Best for large-scale data operations

```bash
export CESAR_MODEL_PATH=artifact_storage/model_<version>.joblib
export CESAR_CONTRACT_PATH=artifact_storage/contract_<version>.json

cesar batch run --input input.csv --output output.csv
```

Processes thousands of records in one pass. The output CSV mirrors the input
with three added columns: `value_low_eur`, `value_mid_eur`, `value_high_eur`.

Input CSV must include: `surface_reelle_bati`, `nombre_pieces_principales`,
`code_departement`, `type_local`.

For a single record:

```bash
cesar predict-one run --surface 50 --pieces 3 --departement 75 --type Appartement
# From JSON file: cesar predict-one run --json one_record.json
# JSON output:  cesar predict-one run --surface 50 --pieces 3 --departement 75 --type Appartement --json-out
```

Use `--model` / `--contract` or set `CESAR_MODEL_PATH` and `CESAR_CONTRACT_PATH`. Valid `--type` values: `Appartement`, `Maison`, `Dépendance`, `Local industriel. commercial ou assimilé`.

## System Architecture



