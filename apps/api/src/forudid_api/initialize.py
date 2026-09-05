"""Initialize private storage without creating synthetic product data."""

from botocore.exceptions import ClientError

from forudid_api.config import settings
from forudid_api.storage import s3


def initialize():
    bucket = settings().s3_bucket
    try:
        s3().head_bucket(Bucket=bucket)
    except ClientError as exc:
        if exc.response["Error"]["Code"] not in ("404", "NoSuchBucket"):
            raise
        s3().create_bucket(Bucket=bucket)


if __name__ == "__main__":
    initialize()
