"""Local commands for versioned sources, existing analysis workers and reports."""

import argparse
import logging
from pathlib import Path
from uuid import UUID


def parser():
    root = argparse.ArgumentParser(prog="forudid", description=__doc__)
    groups = root.add_subparsers(dest="group", required=True)
    data = groups.add_parser("data").add_subparsers(dest="command", required=True)
    listing = data.add_parser("list", help="List registered sources or one source's versions")
    listing.add_argument("--source", type=UUID)
    listing.add_argument("--cursor", type=UUID)
    listing.add_argument("--limit", type=int, choices=range(1, 101), default=20, metavar="1..100")
    for name in ("subsidence", "osm", "population"):
        ingest = data.add_parser(
            f"ingest-{name}", help="Acquire and register the pinned real source"
        )
        ingest.add_argument("directory", type=Path)
        if name == "subsidence":
            ingest.add_argument("--normalized", type=Path, required=True)
        if name == "population":
            ingest.add_argument("--year", type=int, choices=(2020, 2026), default=2026)
    analysis = groups.add_parser("analyze").add_subparsers(dest="command", required=True)
    for name in ("asset", "infrastructure", "population"):
        command = analysis.add_parser(name)
        command.add_argument(
            "--deformation-product", "--product", dest="product", type=UUID, required=True
        )
        if name == "population":
            command.add_argument("--population-version", type=UUID, required=True)
            command.add_argument("--population-raster", type=Path, required=True)
            command.add_argument("--velocity-raster", type=Path, required=True)
            command.add_argument("--region", type=UUID)
        else:
            command.add_argument("--source-version", type=UUID, required=True)
            command.add_argument("--raster", type=Path)
            command.add_argument(
                "--method", choices=["geodesic-midpoint-1"], default="geodesic-midpoint-1"
            )
            if name == "asset":
                command.add_argument("--asset", type=UUID, required=True)
            else:
                command.add_argument("--asset-type", choices=["road", "railway"], required=True)
    region = analysis.add_parser("region", help="Clip a published infrastructure run to a region")
    region.add_argument("--upstream-run", type=UUID, required=True)
    region.add_argument("--region", type=UUID, help="Omit for the complete imported OSM snapshot")
    reports = groups.add_parser("report").add_subparsers(dest="command", required=True)
    for name in ("asset", "region"):
        report = reports.add_parser(name, help="Queue an immutable Persian screening report")
        report.add_argument("--analysis-run", type=UUID, required=True)
        report.add_argument(f"--{name}", type=UUID, required=name == "asset")
        report.add_argument("--language", choices=["fa"], default="fa")
        report.add_argument(
            "--render", action="store_true", help="Render this job in the foreground"
        )
    return root


def execute(args):
    if args.group == "data":
        if args.command == "list":
            from sqlalchemy.orm import Session

            from forudid_api.db import engine
            from forudid_api.sources import sources, versions

            with Session(engine()) as db:
                page = (
                    versions(args.source, db, args.limit, args.cursor)
                    if args.source
                    else sources(db, args.limit, args.cursor)
                )
                print(page.model_dump_json(indent=2))
        elif args.command == "ingest-subsidence":
            from forudid_api.ingest import acquire
            from forudid_api.normalize import normalize
            from forudid_api.publish_historical import publish
            from forudid_api.register_source import register

            acquire(args.directory)
            register(args.directory)
            normalize(args.directory, args.normalized)
            print(publish(args.directory, args.normalized))
        elif args.command == "ingest-osm":
            from forudid_api import ingest_osm as osm

            args.directory.mkdir(parents=True, exist_ok=True)
            path = args.directory / osm.FILENAME
            osm.fetch_file(osm.URL, path, osm.SIZE, osm.MD5)
            normalized = args.directory / osm.PIPELINE
            print(osm.publish(path, normalized, osm.normalize(path, normalized)))
        else:
            from forudid_api.ingest_population import acquire, register

            acquire(args.directory, args.year)
            print(register(args.directory, args.year))
    elif args.group == "analyze":
        if args.command in ("asset", "infrastructure"):
            from forudid_api.analyze import analyze

            result = analyze(
                args.product,
                args.source_version,
                asset_id=getattr(args, "asset", None),
                asset_type=getattr(args, "asset_type", None),
                local_raster=args.raster,
            )
        elif args.command == "population":
            from forudid_api.analyze_population import analyze

            result = analyze(
                args.product,
                args.population_version,
                args.population_raster,
                args.velocity_raster,
                args.region,
            )
        else:
            from forudid_api.analyze_regions import analyze

            result = analyze(args.upstream_run, args.region)
        print(result)
    else:
        from sqlalchemy.orm import Session

        from forudid_api.db import engine
        from forudid_api.report_worker import run_report
        from forudid_api.reports import ReportInfo, ReportRequest, create_report, get_report

        request = ReportRequest(
            scope=args.command,
            analysis_run_id=args.analysis_run,
            language=args.language,
            asset_id=getattr(args, "asset", None),
            region_id=getattr(args, "region", None),
        )
        with Session(engine()) as db:
            identity = create_report(request, db).id
        if args.render:
            run_report(identity)
        with Session(engine()) as db:
            print(ReportInfo.model_validate(get_report(identity, db)).model_dump_json(indent=2))


def main():
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    execute(parser().parse_args())


if __name__ == "__main__":
    main()
