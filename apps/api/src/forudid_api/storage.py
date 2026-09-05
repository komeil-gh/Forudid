import hashlib
import json
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import BinaryIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from forudid_api.config import settings


@lru_cache
def s3():
    cfg = settings()
    return boto3.client(
        "s3",
        endpoint_url=cfg.s3_endpoint,
        region_name=cfg.s3_region,
        aws_access_key_id=cfg.s3_access_key.get_secret_value(),
        aws_secret_access_key=cfg.s3_secret_key.get_secret_value(),
        config=Config(
            signature_version="s3v4",
            connect_timeout=3,
            read_timeout=10,
            retries={"max_attempts": 2},
            s3={"addressing_style": "path" if cfg.s3_path_style else "virtual"},
        ),
    )


def read_url(key: str) -> str:
    return s3().generate_presigned_url(
        "get_object", Params={"Bucket": settings().s3_bucket, "Key": key}, ExpiresIn=120
    )


def read_json(key: str):
    response = s3().get_object(Bucket=settings().s3_bucket, Key=key)
    with response["Body"] as body:
        return json.load(body)


def put_immutable(key: str, body: bytes, media_type: str) -> tuple[str, str]:
    """Never replace objects; compare stored bytes after upload or conflict."""
    return _put_stream(key, BytesIO(body), media_type)


def put_file(key: str, path: Path, media_type: str) -> tuple[str, str]:
    """Archive large source files without materializing their contents in memory."""
    with path.open("rb") as stream:
        return _put_stream(key, stream, media_type)


def _put_stream(key: str, body: BinaryIO, media_type: str) -> tuple[str, str]:
    hasher = hashlib.sha256()
    while chunk := body.read(1024 * 1024):
        hasher.update(chunk)
    checksum = hasher.hexdigest()
    body.seek(0)
    try:
        s3().put_object(
            Bucket=settings().s3_bucket,
            Key=key,
            Body=body,
            ContentType=media_type,
            IfNoneMatch="*",
            Metadata={"sha256": checksum},
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] not in ("PreconditionFailed", "412"):
            raise
    stored = s3().get_object(Bucket=settings().s3_bucket, Key=key)
    with stored["Body"] as stream:
        actual = hashlib.sha256()
        while chunk := stream.read(1024 * 1024):
            actual.update(chunk)
    if actual.hexdigest() != checksum:
        raise ValueError("Immutable object checksum mismatch; create a new run")
    return checksum, stored["ETag"].strip('"')
