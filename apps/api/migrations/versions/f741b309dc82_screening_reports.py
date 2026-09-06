"""Persist independent screening report jobs and immutable artifacts."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "f741b309dc82"
down_revision = "e6c8f210ab34"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "screening_reports",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("analysis_run_id", sa.Uuid(), sa.ForeignKey("analysis_runs.id"), nullable=False),
        sa.Column("asset_id", sa.Uuid(), sa.ForeignKey("assets.id"), nullable=False),
        sa.Column("language", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("inputs", postgresql.JSONB(), nullable=False),
        sa.Column("object_key", sa.String(), unique=True, nullable=True),
        sa.Column("checksum_sha256", sa.String(64), nullable=True),
        sa.Column("html_sha256", sa.String(64), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_code", sa.String(), nullable=True),
        sa.CheckConstraint(
            "status IN ('queued','processing','completed','failed')", name="report_status"
        ),
        sa.CheckConstraint("language = 'fa'", name="report_language"),
    )
    for field in ("analysis_run_id", "asset_id", "status"):
        op.create_index(f"ix_screening_reports_{field}", "screening_reports", [field])


def downgrade():
    if op.get_bind().scalar(sa.text("SELECT EXISTS (SELECT 1 FROM screening_reports)")):
        raise RuntimeError("Reports exist; preserve them before downgrading")
    op.drop_table("screening_reports")
