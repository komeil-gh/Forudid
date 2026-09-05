"""Versioned source registry, independent of processing and publication."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b902a76f12c1"
down_revision = "98916efed35d"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "data_sources",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("slug", sa.String(), unique=True, nullable=False),
        *[
            sa.Column(name, sa.String(), nullable=False)
            for name in (
                "name",
                "provider",
                "source_type",
                "homepage",
                "citation",
                "license_name",
                "license_url",
                "attribution",
                "access_method",
                "scientific_status",
            )
        ],
        sa.CheckConstraint(
            "source_type IN ('deformation','infrastructure','population',"
            "'building','boundary','hydrogeology','other')",
            name="source_type",
        ),
        sa.CheckConstraint(
            "scientific_status IN ('published_peer_reviewed','published_dataset',"
            "'provider_operational','experimental','unknown')",
            name="source_science",
        ),
    )
    op.create_table(
        "source_versions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source_id", sa.Uuid(), sa.ForeignKey("data_sources.id"), nullable=False),
        *[
            sa.Column(name, sa.String(), nullable=False)
            for name in (
                "version",
                "original_uri",
                "object_uri",
            )
        ],
        *[sa.Column(name, sa.Date()) for name in ("data_date", "valid_from", "valid_to")],
        sa.Column("downloaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False),
        sa.UniqueConstraint("source_id", "version", name="source_version_unique"),
        sa.CheckConstraint("size_bytes >= 0", name="source_size_nonnegative"),
        sa.CheckConstraint("checksum_sha256 ~ '^[0-9a-f]{64}$'", name="source_sha256"),
    )
    op.create_index("ix_source_versions_source_id", "source_versions", ["source_id"])
    # Source snapshots are append-only, even for accidental ORM updates.
    op.execute("""CREATE FUNCTION forudid_immutable_source_version() RETURNS trigger
        LANGUAGE plpgsql AS $$ BEGIN
        RAISE EXCEPTION 'Source versions are immutable; create a new version'; END $$""")
    op.execute("""CREATE TRIGGER source_version_immutable BEFORE UPDATE OR DELETE
        ON source_versions FOR EACH ROW EXECUTE FUNCTION forudid_immutable_source_version()""")


def downgrade():
    op.drop_table("source_versions")
    op.execute("DROP FUNCTION forudid_immutable_source_version()")
    op.drop_table("data_sources")
