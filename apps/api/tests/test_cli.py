import json
import os
from unittest.mock import MagicMock
from uuid import UUID

import pytest

from forudid_api.cli import execute, parser


@pytest.mark.parametrize("kind", ["population", "region"])
def test_cli_all_regions_runs_sequentially_and_stops_on_failure(kind, monkeypatch):
    from sqlalchemy import orm

    from forudid_api import analyze_population, analyze_regions, db

    identities = [UUID(int=1), UUID(int=2)]
    session = MagicMock()
    session.__enter__.return_value.scalars.return_value = identities
    monkeypatch.setattr(orm, "Session", lambda _: session)
    monkeypatch.setattr(db, "engine", lambda: None)
    calls = []

    def analyze(*args):
        calls.append(args[-1])
        if args[-1] == identities[0]:
            raise ValueError("Interrupted scope")
        return UUID(int=3)

    monkeypatch.setattr(analyze_population if kind == "population" else analyze_regions,
                        "analyze", analyze)
    options = (["--product", str(identities[0]), "--population-version", str(identities[1]),
                "--population-raster", "population.tif", "--velocity-raster", "velocity.tif"]
               if kind == "population" else ["--upstream-run", str(identities[0])])
    command = ["analyze", kind, *options, "--all-regions"]
    with pytest.raises(ValueError, match="Interrupted scope"):
        execute(parser().parse_args(command))
    assert calls == [None, identities[0]]
    with pytest.raises(SystemExit):
        parser().parse_args([*command, "--region", str(identities[0])])


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
