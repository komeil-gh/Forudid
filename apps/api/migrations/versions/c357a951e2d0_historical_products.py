"""Connect real normalized products to source snapshots, including multi-track mosaics."""

import sqlalchemy as sa
from alembic import op

revision = "c357a951e2d0"
down_revision = "b902a76f12c1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("products", sa.Column("source_version_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "product_source_version", "products", "source_versions", ["source_version_id"], ["id"]
    )
    op.create_index("ix_products_source_version_id", "products", ["source_version_id"])
    op.alter_column("products", "relative_orbit", existing_type=sa.Integer(), nullable=True)
    op.drop_constraint("product_kind", "products", type_="check")
    op.create_check_constraint(
        "product_kind",
        "products",
        "kind IN ('velocity_los','temporal_coherence','velocity_uncertainty','valid_mask',"
        "'timeseries','velocity_vertical','seasonal_amplitude')",
    )


def downgrade():
    # PostgreSQL refuses this if incompatible real products exist; it never deletes them.
    op.drop_constraint("product_kind", "products", type_="check")
    op.create_check_constraint(
        "product_kind",
        "products",
        "kind IN ('velocity_los','temporal_coherence','velocity_uncertainty',"
        "'valid_mask','timeseries')",
    )
    op.alter_column("products", "relative_orbit", existing_type=sa.Integer(), nullable=False)
    op.drop_index("ix_products_source_version_id", table_name="products")
    op.drop_constraint("product_source_version", "products", type_="foreignkey")
    op.drop_column("products", "source_version_id")
