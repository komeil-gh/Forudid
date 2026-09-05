"""Export the runtime contract with stable ordering for client generation and CI."""
import json
from pathlib import Path
from forudid_api.main import app

destination = Path(__file__).resolve().parents[1] / "docs/openapi.json"
destination.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n")
