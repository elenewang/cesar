# CESAR -Property valuation System
CESAR is a modular system to manage the lifecycle of a property valuation model. CESAR enables stakeholders to estimate real estate values via a Web UI and MCP hosts such as Claude Desktop.

---

## Key Capabilities


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
### How it works


### 1. Data & Training

### 2. Model serving 

```bash
uvicorn runtime.prediction_api.app:app --reload --host 0.0.0.0 --port 8000
```
Set `CESAR_MODEL_PATH` and `CESAR_CONTRACT_PATH` in the environment.

### 3. How to access estimates


---
## System Architecture



