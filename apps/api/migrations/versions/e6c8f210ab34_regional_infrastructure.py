"""persist clipped regional infrastructure exposure"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "e6c8f210ab34"
down_revision = "910fc86f6abc"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "regional_infrastructure_results",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "analysis_run_id",
            sa.Uuid(),
            sa.ForeignKey("analysis_runs.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("upstream_run_id", sa.Uuid(), sa.ForeignKey("analysis_runs.id"), nullable=False),
        sa.Column("region_id", sa.Uuid(), sa.ForeignKey("regions.id"), nullable=True),
        sa.Column("asset_type", sa.String(), nullable=False),
        sa.Column("metrics", postgresql.JSONB(), nullable=False),
        sa.Column("object_key", sa.String(), nullable=False, unique=True),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.CheckConstraint("asset_type IN ('railway','road')", name="regional_infrastructure_type"),
    )
    for field in ("upstream_run_id", "region_id"):
        op.create_index(
            f"ix_regional_infrastructure_results_{field}",
            "regional_infrastructure_results",
            [field],
        )


def downgrade():
    if op.get_bind().scalar(
        sa.text("SELECT EXISTS (SELECT 1 FROM regional_infrastructure_results)")
    ):
        raise RuntimeError("Regional results exist; preserve them before downgrading")
    op.drop_table("regional_infrastructure_results")
