"""Provision a read-only tile role and a private, explicit Martin configuration."""

import argparse
import json
import os
import secrets
from pathlib import Path

import psycopg
from psycopg import sql
from sqlalchemy.engine import make_url

from forudid_api.config import settings
from forudid_api.ingest_osm import VERSION_ID

ROLE = "forudid_tiles"
VIEWS = {"railways": ("tiles_railways", "railway"), "major_roads": ("tiles_major_roads", "road")}


def configure(path: Path, listen: str, owner: int | None = None, role_name: str = ROLE) -> None:
    if role_name not in (ROLE, f"{ROLE}_compose"):
        raise ValueError("Unsupported tile role")
    admin = make_url(settings().database_url.get_secret_value()).set(drivername="postgresql")
    password = secrets.token_urlsafe(32)
    if path.exists():
        previous = json.loads(path.read_text())
        saved = make_url(previous["postgres"]["connection_string"])
        if saved.username != role_name or not saved.password:
            raise ValueError("Existing tile configuration has an unexpected role")
        password = saved.password
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
    connection = admin.set(username=role_name, password=password)
    config = {
        "listen_addresses": listen,
        "worker_processes": 1,
        "route_prefix": "/vector",
        "cache": {"size_mb": 32},
        "web_ui": "disable",
        "cors": False,
        "postgres": {
            "connection_string": connection.render_as_string(hide_password=False),
            "pool_size": 2,
            "auto_publish": False,
            "tables": {
                name: {
                    "schema": "tiles",
                    "table": view,
                    "srid": 4326,
                    "geometry_column": "geom",
                    "geometry_type": "LINESTRING",
                    "minzoom": 6,
                    "maxzoom": 16,
                    "bounds": [43, 24, 64, 41],
                    "properties": {
                        "asset_id": "text",
                        "name": "text",
                        "asset_class": "text",
                        "source_version_id": "text",
                    },
                }
                for name, (view, _) in VIEWS.items()
            },
        },
    }
    # The secret is saved first so a retry can recover the same role credential.
    if not path.exists():
        with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "w") as target:
            json.dump(config, target, indent=2)
    elif json.loads(path.read_text()) != config:
        raise ValueError("Existing Martin configuration differs; retain it and review the change")
    if owner is not None:
        os.chown(path, owner, owner)
    with psycopg.connect(admin.render_as_string(hide_password=False)) as db:
        role = db.execute(
            "SELECT rolsuper, rolcreaterole, rolcreatedb, rolbypassrls, rolreplication "
            "FROM pg_roles WHERE rolname=%s",
            (role_name,),
        ).fetchone()
        if role is None:
            db.execute(
                sql.SQL(
                    "CREATE ROLE {} LOGIN PASSWORD {} NOSUPERUSER NOCREATEDB "
                    "NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT CONNECTION LIMIT 4"
                ).format(sql.Identifier(role_name), sql.Literal(password))
            )
        elif any(role):
            raise ValueError("Existing tile role has elevated privileges")
        db.execute(
            sql.SQL("ALTER ROLE {} SET default_transaction_read_only=on").format(
                sql.Identifier(role_name)
            )
        )
        db.execute(
            sql.SQL("ALTER ROLE {} SET statement_timeout='10s'").format(sql.Identifier(role_name))
        )
        db.execute("CREATE SCHEMA IF NOT EXISTS tiles")
        for view, kind in VIEWS.values():
            db.execute(
                sql.SQL(
                    "CREATE OR REPLACE VIEW tiles.{} AS SELECT id::text AS asset_id, "
                    "name, asset_class, source_version_id::text AS source_version_id, geom "
                    "FROM public.assets WHERE asset_type={} AND source_version_id={}"
                ).format(sql.Identifier(view), sql.Literal(kind), sql.Literal(VERSION_ID))
            )
            attribution = json.dumps(
                {
                    "attribution": "© OpenStreetMap contributors / Geofabrik",
                    "version": "260904",
                    "description": "Raw OSM ways; coverage may be incomplete",
                }
            )
            db.execute(
                sql.SQL("COMMENT ON VIEW tiles.{} IS {}").format(
                    sql.Identifier(view), sql.Literal(attribution)
                )
            )
            db.execute(
                sql.SQL("GRANT SELECT ON tiles.{} TO {}").format(
                    sql.Identifier(view), sql.Identifier(role_name)
                )
            )
        db.execute(sql.SQL("GRANT USAGE ON SCHEMA tiles TO {}").format(sql.Identifier(role_name)))
    print("Configured explicit read-only Martin sources", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", type=Path)
    parser.add_argument("--listen", default="127.0.0.1:58300")
    parser.add_argument("--owner", type=int)
    parser.add_argument("--role", choices=[ROLE, f"{ROLE}_compose"], default=ROLE)
    args = parser.parse_args()
    configure(args.path, args.listen, args.owner, args.role)
