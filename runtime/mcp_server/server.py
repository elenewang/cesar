import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from mcp.server.fastmcp import FastMCP
import math

from runtime.inference.load_artifact import load_artifact_from_path
from prediction_contract.request_schema import EstimateRequest
from runtime.inference.estimate_from_artifact import estimate_from_model

model, contract = load_artifact_from_path( 
    Path("artifact_storage/model_minimal.joblib"), 
    Path("artifact_storage/contract_minimal.json")
)

mcp = FastMCP("property-estimator")

@mcp.tool()
def get_estimate(surface: float , rooms: float, department: str, property_type: str)-> str: 
    request = EstimateRequest(
        surface_reelle_bati = surface,
        nombre_pieces_principales = rooms,
        code_departement = department,
        type_local = property_type
    )

    result = estimate_from_model(model,request, contract)
    return f"Estimated property value: €{result.estimated_value_eur:,.0f}"
    
