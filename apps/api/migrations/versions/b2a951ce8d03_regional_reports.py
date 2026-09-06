"""Allow reports pinned to population and clipped infrastructure analyses."""

import sqlalchemy as sa
from alembic import op

revision = "b2a951ce8d03"
down_revision = "f741b309dc82"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column("screening_reports", "asset_id", nullable=True)
    op.add_column(
        "screening_reports",
        sa.Column("region_id", sa.Uuid(), sa.ForeignKey("regions.id"), nullable=True),
    )
    op.add_column(
        "screening_reports", sa.Column("scope", sa.String(), server_default="asset", nullable=False)
    )
    op.alter_column("screening_reports", "scope", server_default=None)
    op.create_index("ix_screening_reports_region_id", "screening_reports", ["region_id"])
    op.create_check_constraint(
        "report_scope",
        "screening_reports",
        "(scope = 'asset' AND asset_id IS NOT NULL AND region_id IS NULL) OR "
        "(scope = 'region' AND asset_id IS NULL)",
    )


def downgrade():
    if op.get_bind().scalar(
        sa.text("SELECT EXISTS (SELECT 1 FROM screening_reports WHERE scope = 'region')")
    ):
        raise RuntimeError("Regional reports exist; preserve them before downgrading")
    op.drop_constraint("report_scope", "screening_reports", type_="check")
    op.drop_index("ix_screening_reports_region_id", "screening_reports")
    op.drop_column("screening_reports", "region_id")
    op.drop_column("screening_reports", "scope")
    op.alter_column("screening_reports", "asset_id", nullable=False)
