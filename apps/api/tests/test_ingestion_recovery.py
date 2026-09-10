"""Exercise real HTTP recovery without putting test measurements in the catalog."""

import fcntl
import hashlib
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread

import pytest

from forudid_api.ingest import fetch_file


@pytest.mark.parametrize(
    "mode", ["resume", "empty", "ignore", "wrong-range", "corrupt", "interrupt"]
)
def test_http_download_recovery(tmp_path, mode):
    payload = b"checksum-pinned source bytes" * 100
    checksum = hashlib.sha256(payload).hexdigest()
    output = tmp_path / "source.hdf5"
    partial = tmp_path / f"{output.name}.sha256-{checksum}.partial"
    partial.write_bytes(b"" if mode == "empty" else payload[:73])
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_GET(self):
            requests.append(self.headers.get("Range"))
            offset = int(self.headers.get("Range", "bytes=0-")[6:-1])
            if mode == "ignore":
                offset = 0
            self.send_response(206 if offset else 200)
            if offset:
                start = offset + (1 if mode == "wrong-range" else 0)
                self.send_header("Content-Range", f"bytes {start}-{len(payload)-1}/{len(payload)}")
            self.send_header("Content-Length", str(len(payload) - offset))
            self.end_headers()
            body = payload[offset:]
            if mode == "interrupt" and len(requests) == 1:
                body = body[:91]
            if mode == "corrupt":
                body = b"x" * len(body)
            self.wfile.write(body)

    server = HTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, kwargs={"poll_interval": 0.01})
    thread.start()
    url = f"http://127.0.0.1:{server.server_port}/source"
    try:
        if mode in ("wrong-range", "corrupt", "interrupt"):
            with pytest.raises(ValueError):
                fetch_file(url, output, len(payload), checksum, algorithm="sha256")
            assert not output.exists()
            assert partial.read_bytes().startswith(payload[:73])
            if mode != "interrupt":
                return
            assert partial.stat().st_size == 164
        fetch_file(url, output, len(payload), checksum, algorithm="sha256")
        assert output.read_bytes() == payload and not partial.exists()
        assert requests[0] == (None if mode == "empty" else "bytes=73-")
        if mode == "interrupt":
            assert requests == ["bytes=73-", "bytes=164-"]
        fetch_file(url, output, len(payload), checksum, algorithm="sha256")
        with partial.with_suffix(".lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with pytest.raises(ValueError, match="already active"):
                fetch_file(url, output, len(payload), checksum, algorithm="sha256")
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def test_comet_metadata_gate_and_cli_do_not_publish_changed_source(tmp_path, monkeypatch):
    from forudid_api import ingest_comet
    from forudid_api.cli import execute, parser

    class Response:
        status = 200
        headers = {"Content-Length": "999", "Last-Modified": ingest_comet.LAST_MODIFIED}

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            pass

    monkeypatch.setattr(ingest_comet, "urlopen", lambda *args, **kwargs: Response())
    with pytest.raises(SystemExit) as error:
        execute(parser().parse_args(["data", "check-comet", str(tmp_path)]))
    assert error.value.code == 2
    with pytest.raises(ValueError, match="review required"):
        execute(parser().parse_args([
            "data", "ingest-comet", str(tmp_path), "--normalized", str(tmp_path / "normalized")
        ]))
    checks = [json.loads(p.read_text()) for p in (tmp_path / "checks").glob("*.json")]
    assert len(checks) == 2
    assert all(c["status"] == "review_required" and not c["remote_bytes_verified"] for c in checks)
    assert not (tmp_path / ingest_comet.FILENAME).exists()
    assert not (tmp_path / "normalized").exists()


def test_comet_failed_normalization_retries_in_a_new_directory(tmp_path, monkeypatch):
    from forudid_api import ingest_comet, publish_comet

    monkeypatch.setattr(ingest_comet, "check_source", lambda _: {
        "status": "metadata_matches_reviewed_snapshot"
    })
    monkeypatch.setattr(ingest_comet, "fetch_file", lambda *args, **kwargs: None)
    attempts = []

    def prepare(_source, directory):
        attempts.append(directory)
        directory.mkdir()
        (directory / "artifact").write_text("isolated software test")
        if len(attempts) == 1:
            raise ValueError("Interrupted conversion")

    monkeypatch.setattr(ingest_comet, "prepare", prepare)
    monkeypatch.setattr(publish_comet, "publish", lambda *_: "same-immutable-run")
    normalized = tmp_path / "normalized"
    with pytest.raises(ValueError, match="Interrupted"):
        ingest_comet.ingest(tmp_path, normalized)
    assert not normalized.exists() and attempts[0].exists()
    assert ingest_comet.ingest(tmp_path, normalized) == "same-immutable-run"
    assert attempts[0] != attempts[1] and attempts[0].exists()
    assert (normalized / "artifact").exists()
    assert ingest_comet.ingest(tmp_path, normalized) == "same-immutable-run"
    assert len(attempts) == 2
