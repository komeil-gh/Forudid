"""scope population results to registered historical regions"""

from alembic import op
import sqlalchemy as sa

revision = "910fc86f6abc"
down_revision = "f478982ff999"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("population_exposure_results", sa.Column("region_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "population_region_fk", "population_exposure_results", "regions", ["region_id"], ["id"]
    )
    op.create_index(
        "ix_population_exposure_results_region_id", "population_exposure_results", ["region_id"]
    )


def downgrade():
    if op.get_bind().scalar(
        sa.text(
            "SELECT EXISTS (SELECT 1 FROM population_exposure_results WHERE region_id IS NOT NULL)"
        )
    ):
        raise RuntimeError("Regional population results exist; preserve them before downgrading")
    op.drop_index(
        "ix_population_exposure_results_region_id", table_name="population_exposure_results"
    )
    op.drop_constraint("population_region_fk", "population_exposure_results", type_="foreignkey")
    op.drop_column("population_exposure_results", "region_id")
