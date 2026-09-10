"""Create a reviewed source snapshot from HEAD, without repository history."""

import gzip
import hashlib
import io
import json
import re
import subprocess
import tarfile
from pathlib import Path, PurePosixPath


def inspect_archive(data: bytes) -> dict[str, str]:
    """Reject private material and unsafe entries before writing an archive."""
    files = {}
    forbidden = {
        ".git", ".env", ".agents", ".codex", ".codex-toolkit", ".tools",
        ".venv", "node_modules", "data", "dist", "AGENTS.md", "source-marks",
    }
    with tarfile.open(fileobj=io.BytesIO(data)) as archive:
        for member in archive:
            path = PurePosixPath(member.name)
            if path.is_absolute() or ".." in path.parts or forbidden.intersection(path.parts):
                raise ValueError(f"Private or unsafe archive path: {member.name}")
            if path.name.startswith(".env.") and path.name != ".env.example":
                raise ValueError(f"Local environment file: {member.name}")
            if member.isdir():
                continue
            if not member.isfile() or member.size > 5_000_000:
                raise ValueError(f"Unsupported type or oversized file: {member.name}")
            if path.suffix.lower() in {".tif", ".tiff", ".h5", ".hdf5", ".pbf", ".pdf", ".dump"}:
                raise ValueError(f"Data or generated artifact: {member.name}")
            if member.name in files:
                raise ValueError(f"Duplicate archive path: {member.name}")
            content = archive.extractfile(member).read()
            files[member.name] = hashlib.sha256(content).hexdigest()
    required = {"LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md", "README.md",
                "LICENSES/ODbL-1.0.txt", "apps/web/public/fonts/xb-zar/OFL.txt"}
    if not required.issubset(files):
        raise ValueError(f"Missing required notices: {sorted(required - files.keys())}")
    return dict(sorted(files.items()))


def main() -> None:
    root = Path(__file__).resolve().parents[1]

    def git(*args: str) -> bytes:
        return subprocess.check_output(["git", *args], cwd=root)

    commit = git("rev-parse", "HEAD").decode().strip()
    version = json.loads(git("show", "HEAD:package.json"))["version"]
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[a-z0-9.]+)?", version):
        raise ValueError("Invalid release version")
    # Git uses committed export attributes; untracked artwork and local settings stay private.
    source = git("archive", "--format=tar", "HEAD")
    files = inspect_archive(source)
    compressed = gzip.compress(source, mtime=0)
    name = f"forudid-{version}-{commit[:12]}-source.tar.gz"
    checksum = hashlib.sha256(compressed).hexdigest()
    output = root / "data/releases"
    output.mkdir(parents=True, exist_ok=True)
    artifacts = {
        name: compressed,
        f"{name}.sha256": f"{checksum}  {name}\n".encode(),
        f"{name}.manifest.json": (json.dumps({
            "commit": commit, "version": version, "archive_sha256": checksum,
            "files": files,
        }, indent=2, ensure_ascii=False) + "\n").encode(),
    }
    for filename, content in artifacts.items():
        destination = output / filename
        if destination.exists() and destination.read_bytes() != content:
            raise ValueError(f"Refusing to overwrite a different artifact: {filename}")
    for filename, content in artifacts.items():
        (output / filename).write_bytes(content)
    print(f"Prepared {name}: {len(files)} files; SHA-256 {checksum}")


if __name__ == "__main__":
    main()
