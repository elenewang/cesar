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

**Data sources**

The training pipeline relies on French property transaction data. We worked with two main sources:

- an initial raw DVF data used to validate the first baseline (given), that was based in the 15th arrondissement of Paris
- additional cleaned Paris transaction data from the platform DVI Ceif. 

The goal of our data work was not only to clean the raw files, but also to make the expanded dataset compatible with the existing CESAR baseline training pipeline.

**Cleaning the original raw data**

The file was not directly ready for training, so the first step was to parse it correctly by checking the separator, quoting, and header structure before loading it into a dataframe.

Then we cleaned it to obtain a format that could later match the richer cleaned format used in the project. In practice, this mainly involved:

- converting the relevant columns to the right types, especially numeric values and dates
- removing columns that were not needed for the baseline training pipeline
- removing rows with missing values in key fields
- keeping usable property rows for the baseline model, mainly Appartement
- excluding rows such as Dépendance, which were not appropriate for the first baseline

One difficulty was that one real estate transaction can appear on several rows in the raw data. This happens because one sale can include the main property, dependencies and one or more additional lots, which means not every row could be used directly as a training example.

This first cleaning step allowed us to produce a clean dataset with a structure that could later be aligned with the richer cleaned data.

**Adding and aligning new data**

After the first cleaned version was prepared, additional Paris transaction data from DVI Ceif was integrated. It was important for us to go with real data, and not just synthetic sales references. 

The search was done arrondissement by arrondissement, by drawing a zone on a map of the city directly available on the platform. We kept only transactions between January and June of 2025 (June being the last available data) of apartments of surfaces between 30 and 120 m². 

This was decided because most apprtments sold in Paris are in these surfaces, and also because the website DVI Ceif allows conversion to csv for only a certain amount of references of appartments sold, limiting our searches to particular periods of time and geographical zones. This also explains why we had to do our new data retrieval arrondissement per arrondissement, and not just for the whole city at once. 

These new files were already cleaner and larger than the original raw example, but they still had to follow the same cleaned structure so that everything could be combined consistently.

To do this, the new data was prepared according to the same cleaned format as the first processed raw dataset, using a simple notebook called `dataCleaning_DCICeif.ipynb`. 
This notebook processes the new data arrondissement per arrondissement, stores it in separate csv files in a folder (data/per_arrondissement) and then combines all these into one single csv file. This allowed us to have more than 4,600 lines in our final csv data file. 

**Combining the datasets**

Once both sources (already available & new one retrieved) followed the same cleaned format, they were combined into a larger dataset. This combined dataset became the main cleaned rich dataset of the project. It gave us a much larger training base than the original raw sample and allowed us to test the CESAR baseline model on expanded data.

**Preparing the model-compatible dataset**

Because the existing CESAR baseline training code does not directly use the full rich schema, we then derived a simplified version of the combined dataset containing only the columns required by the current model. This model-compatible dataset was used to run the existing training pipeline without changing the baseline model structure.

**Final compatibility adjustments**

When testing the combined dataset with the existing CESAR model, we found that a few final adjustments were needed. 

First, some type_local values in the expanded data were not supported by the baseline model. To make the model run correctly, we filtered the data to keep only the property types compatible with the current baseline, which was "Appartement" and "Maison".

Then we identified one remaining row with a missing valeur_fonciere. Since valeur_fonciere is the target variable, this row had to be removed before training.

After these final adjustments, the baseline CESAR training script was able to run successfully on the expanded combined dataset.

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

CESAR is organized into three layers: training, serving, and access. 

**Training**

The training pipeline is found in `training/`. It reads a CSV file, fits a quantile regression model, and exports two files to `artifact_storage/`: a `.joblib` model file and a `.json` contract file which describes the input schema and model version. 

**Serving**

An inference layer in `runtime/inference/` loads the model and contract files and runs the predictions. 

**Access**

A user has access to three entry points each targeting a specific use case:

- `runtime/prediction_api/`: FastAPI HTTP server used by the Web UI and other APIs
- `runtime/mcp_server/`: MCP server that directly exposes the model as a tool for AI agents (e.g. Claude)
- `runtime/batch_prediction/`: reads an input CSV, runs batch estimates, and writes an output CSV. Can be used via the `cesar batch run` CLI command. 





