import hashlib
import os
import subprocess
from pathlib import Path
from uuid import UUID

import pytest


@pytest.mark.skipif(
    not os.environ.get("FORUDID_REGION_REPORT_TESTS"),
    reason="Requires complete real regional inputs and local PDF renderer",
)
@pytest.mark.parametrize(
    "region,run,rail,road,name",
    [
        (
            "637d5b9a-e103-54e0-8379-60beb1b21b40",
            "9af897e3-7f1b-5fa9-83ca-65e30b8d9f94",
            "3b5ba137-4149-5d14-89f3-55f7464bbcbf",
            "46edf9b6-b56a-5741-97b3-9b49dfd814d1",
            "tehran",
        ),
        (
            None,
            "f2eb002e-9c3e-5bab-bf4d-e93197945448",
            "43afd0f0-d572-5ad1-9495-2212affc0728",
            "6ac61d23-8081-5a65-8775-85783854ad96",
            "country",
        ),
    ],
)
def test_real_regional_report_pins_all_three_analyses(region, run, rail, road, name):
    from fastapi.testclient import TestClient

    from forudid_api.main import app
    from forudid_api.report_worker import run_report

    client = TestClient(app)
    payload = {"scope": "region", "analysis_run_id": run, "region_id": region}
    assert (
        client.post(
            "/api/v1/reports", json={**payload, "asset_id": "29cbefaf-1ef9-594a-9957-68060bf45846"}
        ).status_code
        == 422
    )
    wrong = {**payload, "analysis_run_id": "f30d71aa-bda6-5098-b050-eed1f9657f0f"}
    assert client.post("/api/v1/reports", json=wrong).status_code == 404
    request = client.post("/api/v1/reports", json=payload)
    assert request.status_code == 202, request.text
    job = request.json()
    assert job["scope"] == "region" and job["asset_id"] is None and job["region_id"] == region
    assert client.post("/api/v1/reports", json=payload).json()["id"] == job["id"]
    if job["status"] != "completed":
        assert run_report(UUID(job["id"]), retry=True) == UUID(job["id"])
    base = "/api/v1/reports/" + job["id"]
    completed = client.get(base).json()
    assert completed["status"] == "completed"
    pdf = client.get(base + "/download")
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF-")
    assert hashlib.sha256(pdf.content).hexdigest() == completed["checksum_sha256"]
    path = Path(f"/tmp/forudid-qa/report-{name}.pdf")
    path.parent.mkdir(exist_ok=True)
    path.write_bytes(pdf.content)
    text = subprocess.check_output(["pdftotext", str(path), "-"], text=True)
    assert all(identity in text for identity in (run, rail, road, job["id"]))
    assert "WorldPop" in text and "ODbL" in text and "CC BY 4.0" in text
    assert client.get(base + "/download").content == pdf.content
