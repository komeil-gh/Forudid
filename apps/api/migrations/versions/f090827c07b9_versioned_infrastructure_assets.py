"""versioned_infrastructure_assets"""

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "f090827c07b9"
down_revision = "c357a951e2d0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "assets",
        sa.Column("source_version_id", sa.Uuid(), nullable=False),
        sa.Column("external_id", sa.String(), nullable=False),
        sa.Column("asset_type", sa.String(), nullable=False),
        sa.Column("asset_class", sa.String(), nullable=False),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="LINESTRING",
                srid=4326,
                dimension=2,
                from_text="ST_GeomFromEWKT",
                name="geometry",
                nullable=False,
                spatial_index=False,
            ),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("length_m", sa.Float(), nullable=False),
        sa.Column("properties", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("data_quality", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("asset_type IN ('railway','road')", name="infrastructure_type"),
        sa.CheckConstraint(
            "ST_IsValid(geom) AND NOT ST_IsEmpty(geom)", name="infrastructure_geometry"
        ),
        sa.CheckConstraint("length_m > 0", name="infrastructure_length"),
        sa.ForeignKeyConstraint(
            ["source_version_id"],
            ["source_versions.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "source_version_id", "external_id", "asset_type", name="asset_identity"
        ),
    )
    op.create_index("idx_assets_geom", "assets", ["geom"], unique=False, postgresql_using="gist")
    op.create_index(op.f("ix_assets_asset_class"), "assets", ["asset_class"], unique=False)
    op.create_index(op.f("ix_assets_asset_type"), "assets", ["asset_type"], unique=False)
    op.create_index(op.f("ix_assets_external_id"), "assets", ["external_id"], unique=False)
    op.create_index(
        op.f("ix_assets_source_version_id"), "assets", ["source_version_id"], unique=False
    )


def downgrade():
    op.execute("""DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM assets LIMIT 1) THEN
            RAISE EXCEPTION 'Cannot drop populated infrastructure snapshot';
        END IF;
    END $$""")
    op.drop_index(op.f("ix_assets_source_version_id"), table_name="assets")
    op.drop_index(op.f("ix_assets_external_id"), table_name="assets")
    op.drop_index(op.f("ix_assets_asset_type"), table_name="assets")
    op.drop_index(op.f("ix_assets_asset_class"), table_name="assets")
    op.drop_index("idx_assets_geom", table_name="assets", postgresql_using="gist")
    op.drop_table("assets")
