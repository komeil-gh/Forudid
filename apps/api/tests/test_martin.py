import json
import os
from pathlib import Path

import httpx
import psycopg
import pytest


@pytest.mark.skipif(not os.environ.get("FORUDID_MARTIN_TESTS"), reason="Requires local Martin")
def test_explicit_real_tiles_and_read_only_role():
    base = os.environ.get("FORUDID_VECTOR_URL", "http://127.0.0.1:58300/vector")
    config = json.loads(
        Path(os.environ.get("FORUDID_MARTIN_CONFIG", ".tools/martin.json")).read_text()
    )
    assert config["postgres"]["auto_publish"] is False
    with httpx.Client(timeout=20) as client:
        catalog = client.get(f"{base}/catalog").json()
        assert set(catalog["tiles"]) == {"railways", "major_roads"}
        for source in ("railways", "major_roads"):
            metadata = client.get(f"{base}/{source}").json()
            assert "OpenStreetMap" in metadata["attribution"]
            assert set(metadata["vector_layers"][0]["fields"]) == {
                "asset_id",
                "asset_class",
                "name",
                "source_version_id",
            }
            # Tehran z10: actual infrastructure exists in this bounded tile.
            tile = client.get(f"{base}/{source}/10/657/403")
            assert tile.status_code == 200
            assert "protobuf" in tile.headers["content-type"]
            assert 0 < len(tile.content) < 2_000_000
        for private in ("assets", "source_versions", "product_assets"):
            assert client.get(f"{base}/{private}").status_code == 404
    with psycopg.connect(config["postgres"]["connection_string"]) as db:
        assert db.execute("SELECT count(*) FROM tiles.tiles_railways").fetchone()[0] == 12722
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            db.execute("SELECT * FROM public.source_versions LIMIT 1")
        db.rollback()
        db.execute("SET TRANSACTION READ WRITE")
        with pytest.raises(psycopg.errors.InsufficientPrivilege):
            db.execute("UPDATE tiles.tiles_railways SET name=name WHERE false")
        db.rollback()
