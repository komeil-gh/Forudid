"""Create private local credentials once, without printing or overwriting them."""
from pathlib import Path
import secrets

path = Path(__file__).resolve().parents[1] / ".env"
if path.exists():
    raise SystemExit(".env already exists; preserved")
password, secret = secrets.token_hex(24), secrets.token_hex(24)
path.write_text(
    f"POSTGRES_DB=forudid\nPOSTGRES_USER=forudid\nPOSTGRES_PASSWORD={password}\n"
    f"DB_PORT=55432\nDATABASE_URL=postgresql+psycopg://forudid:{password}@127.0.0.1:55432/forudid\n"
    f"S3_ENDPOINT=http://127.0.0.1:59000\nS3_REGION=us-east-1\nS3_ACCESS_KEY=forudid-local\n"
    f"S3_SECRET_KEY={secret}\nS3_BUCKET=forudid\nS3_PATH_STYLE=true\nS3_PREFIX=aoi\n"
    "S3_PORT=59000\nAPI_PORT=58000\nWEB_PORT=5173\nLOCAL_PORT=58080\n"
    'CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:58080"]\n'
    "VITE_API_BASE_URL=\nVITE_API_PROXY_TARGET=http://127.0.0.1:58000\n"
    "VITE_BASEMAP_STYLE_URL=\nVITE_BASEMAP_ATTRIBUTION=\n"
)
path.chmod(0o600)
print("Created private .env for localhost development")
