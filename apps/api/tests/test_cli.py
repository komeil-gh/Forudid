import json
import os
from uuid import UUID

import pytest

from forudid_api.cli import execute, parser


def test_cli_routes_exact_asset_inputs_and_rejects_unavailable_hazard(monkeypatch, capsys):
    from forudid_api import analyze

    identity = UUID("29cbefaf-1ef9-594a-9957-68060bf45846")
    product = UUID("744b6536-b9a7-56c5-85b1-66a629a78b91")
    source = UUID("b540a66b-41c4-58a9-9a68-e63f5ffb226d")
    command = [
        "analyze",
        "asset",
        "--asset",
        str(identity),
        "--product",
        str(product),
        "--source-version",
        str(source),
    ]
    calls = []
    monkeypatch.setattr(
        analyze, "analyze", lambda *args, **kwargs: calls.append((args, kwargs)) or identity
    )
    execute(parser().parse_args(command))
    assert calls == [
        ((product, source), {"asset_id": identity, "asset_type": None, "local_raster": None})
    ]
    assert str(identity) in capsys.readouterr().out
    with pytest.raises(SystemExit) as error:
        parser().parse_args([*command, "--method", "payne-2025-beta-v1"])
    assert error.value.code == 2
    with pytest.raises(SystemExit):
        parser().parse_args(["report", "asset", "--analysis-run", str(identity)])


@pytest.mark.skipif(
    not os.environ.get("FORUDID_CLI_REAL_TESTS"), reason="Requires local real sources"
)
def test_cli_real_sources_and_existing_region_report(capsys):
    execute(parser().parse_args(["data", "list"]))
    listing = json.loads(capsys.readouterr().out)
    assert len(listing["items"]) >= 4
    execute(
        parser().parse_args(
            [
                "report",
                "region",
                "--analysis-run",
                "9af897e3-7f1b-5fa9-83ca-65e30b8d9f94",
                "--region",
                "637d5b9a-e103-54e0-8379-60beb1b21b40",
            ]
        )
    )
    report = json.loads(capsys.readouterr().out)
    assert report["scope"] == "region" and report["error_code"] is None
    assert report["analysis_run_id"] == "9af897e3-7f1b-5fa9-83ca-65e30b8d9f94"
