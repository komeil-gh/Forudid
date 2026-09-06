"""event_evidence_foundation"""

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "49cbd0d1fb37"
down_revision = "b2a951ce8d03"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "deformation_events",
        sa.Column("event_key", sa.String(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="MULTIPOLYGON",
                srid=4326,
                dimension=2,
                spatial_index=False,
                from_text="ST_GeomFromEWKT",
                name="geometry",
                nullable=False,
            ),
            nullable=False,
        ),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("publication", sa.String(), nullable=False),
        sa.Column("is_fixture", sa.Boolean(), nullable=False),
        sa.Column("revision_number", sa.Integer(), nullable=False),
        sa.Column("first_detected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("estimated_onset_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_velocity", sa.Float(), nullable=True),
        sa.Column("previous_velocity", sa.Float(), nullable=True),
        sa.Column("acceleration_metric", sa.Float(), nullable=True),
        sa.Column("area_current", sa.Float(), nullable=False),
        sa.Column("area_max", sa.Float(), nullable=False),
        sa.Column("growth_rate", sa.Float(), nullable=True),
        sa.Column("dominant_component", sa.String(), nullable=False),
        sa.Column("confidence_grade", sa.String(), nullable=False),
        sa.Column("severity_screening_class", sa.String(), nullable=True),
        sa.Column("scientific_status", sa.String(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("confidence_grade IN ('A','B','C','D','U')", name="event_grade"),
        sa.CheckConstraint(
            "publication IN ('draft','published','withdrawn')", name="event_publication"
        ),
        sa.CheckConstraint(
            "scientific_status IN ('experimental','review','validated')", name="event_science"
        ),
        sa.CheckConstraint(
            "status IN ('candidate','under_review','corroborated','monitoring','escalated',"
            "'stable','resolved','seasonal','artifact','rejected')",
            name="event_lifecycle",
        ),
        sa.CheckConstraint("ST_IsValid(geom) AND NOT ST_IsEmpty(geom)", name="event_geometry"),
        sa.CheckConstraint("area_current >= 0 AND area_max >= area_current", name="event_area"),
        sa.CheckConstraint(
            "estimated_onset_at IS NULL OR estimated_onset_at <= last_observed_at",
            name="event_time_order",
        ),
        sa.CheckConstraint("revision_number >= 1", name="event_revision_positive"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_key"),
    )
    op.create_index(
        "idx_deformation_events_geom",
        "deformation_events",
        ["geom"],
        unique=False,
        postgresql_using="gist",
    )
    op.create_index(
        op.f("ix_deformation_events_publication"),
        "deformation_events",
        ["publication"],
        unique=False,
    )
    op.create_index(
        op.f("ix_deformation_events_status"), "deformation_events", ["status"], unique=False
    )
    op.create_table(
        "event_revisions",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("revision_number", sa.Integer(), nullable=False),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="MULTIPOLYGON",
                srid=4326,
                dimension=2,
                spatial_index=False,
                from_text="ST_GeomFromEWKT",
                name="geometry",
                nullable=False,
            ),
            nullable=False,
        ),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("actor", sa.String(), nullable=False),
        sa.Column("source_processing_run_id", sa.Uuid(), nullable=False),
        sa.Column("provenance", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("input_sha256", sa.String(length=64), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("input_sha256 ~ '^[0-9a-f]{64}$'", name="revision_input_sha256"),
        sa.CheckConstraint("ST_IsValid(geom) AND NOT ST_IsEmpty(geom)", name="revision_geometry"),
        sa.CheckConstraint("revision_number >= 1", name="revision_number_positive"),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["deformation_events.id"],
        ),
        sa.ForeignKeyConstraint(
            ["source_processing_run_id"],
            ["processing_runs.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "revision_number", name="event_revision_identity"),
    )
    op.create_index(
        "idx_event_revisions_geom",
        "event_revisions",
        ["geom"],
        unique=False,
        postgresql_using="gist",
    )
    op.create_index(
        op.f("ix_event_revisions_event_id"), "event_revisions", ["event_id"], unique=False
    )
    op.create_table(
        "event_observations",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("observation_key", sa.String(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("source_version_id", sa.Uuid(), nullable=False),
        sa.Column("interval_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("interval_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sensor_family", sa.String(), nullable=False),
        sa.Column("component", sa.String(), nullable=False),
        sa.Column("measurement_method", sa.String(), nullable=False),
        sa.Column("maturity", sa.String(), nullable=False),
        sa.Column("raw_acquisition_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("velocity", sa.Float(), nullable=True),
        sa.Column("displacement", sa.Float(), nullable=True),
        sa.Column("acceleration", sa.Float(), nullable=True),
        sa.Column("area", sa.Float(), nullable=True),
        sa.Column("coverage", sa.Float(), nullable=True),
        sa.Column("uncertainty", sa.Float(), nullable=True),
        sa.Column("quality", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "component IN ('los','vertical','east_west','north_south','three_dimensional')",
            name="observation_component",
        ),
        sa.CheckConstraint(
            "maturity IN ('beta','provisional','validated','unknown')", name="observation_maturity"
        ),
        sa.CheckConstraint("area IS NULL OR area >= 0", name="observation_area"),
        sa.CheckConstraint("available_at >= interval_end", name="observation_availability"),
        sa.CheckConstraint(
            "coverage IS NULL OR (coverage >= 0 AND coverage <= 1)", name="observation_coverage"
        ),
        sa.CheckConstraint("interval_end >= interval_start", name="observation_interval"),
        sa.CheckConstraint(
            "jsonb_array_length(raw_acquisition_ids) > 0", name="observation_raw_lineage"
        ),
        sa.CheckConstraint(
            "uncertainty IS NULL OR uncertainty >= 0", name="observation_uncertainty"
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["deformation_events.id"],
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
        ),
        sa.ForeignKeyConstraint(
            ["source_version_id"],
            ["source_versions.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "id", name="observation_event_identity"),
        sa.UniqueConstraint("event_id", "observation_key", name="event_observation_identity"),
    )
    op.create_index(
        op.f("ix_event_observations_event_id"), "event_observations", ["event_id"], unique=False
    )
    op.create_index(
        op.f("ix_event_observations_product_id"), "event_observations", ["product_id"], unique=False
    )
    op.create_table(
        "event_evidence",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("evidence_key", sa.String(), nullable=False),
        sa.Column("evidence_type", sa.String(), nullable=False),
        sa.Column("source_version_id", sa.Uuid(), nullable=False),
        sa.Column("observation_id", sa.Uuid(), nullable=True),
        sa.Column("supersedes_id", sa.Uuid(), nullable=True),
        sa.Column("supports_event", sa.Boolean(), nullable=False),
        sa.Column("contradicts_event", sa.Boolean(), nullable=False),
        sa.Column("independence_group", sa.String(), nullable=False),
        sa.Column("quality", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("summary", sa.String(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("NOT (supports_event AND contradicts_event)", name="evidence_position"),
        sa.CheckConstraint("length(independence_group) > 0", name="evidence_independence_group"),
        sa.ForeignKeyConstraint(
            ["event_id", "observation_id"],
            ["event_observations.event_id", "event_observations.id"],
            name="evidence_observation_event",
        ),
        sa.ForeignKeyConstraint(
            ["event_id", "supersedes_id"],
            ["event_evidence.event_id", "event_evidence.id"],
            name="evidence_supersedes_event",
        ),
        sa.ForeignKeyConstraint(
            ["event_id"],
            ["deformation_events.id"],
        ),
        sa.ForeignKeyConstraint(
            ["source_version_id"],
            ["source_versions.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "evidence_key", name="event_evidence_identity"),
        sa.UniqueConstraint("event_id", "id", name="evidence_event_identity"),
    )
    op.create_index(
        op.f("ix_event_evidence_event_id"), "event_evidence", ["event_id"], unique=False
    )
    op.create_foreign_key(
        "event_current_revision",
        "deformation_events",
        "event_revisions",
        ["id", "revision_number"],
        ["event_id", "revision_number"],
        deferrable=True,
        initially="DEFERRED",
    )
    op.execute("""CREATE FUNCTION preserve_event_history() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Event history is append-only'; END $$""")
    for table in ("event_revisions", "event_observations", "event_evidence"):
        op.execute(
            f"CREATE TRIGGER preserve_history BEFORE UPDATE OR DELETE ON {table} "
            "FOR EACH ROW EXECUTE FUNCTION preserve_event_history()"
        )
    op.execute("""CREATE FUNCTION require_event_revision() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Retain rejected and artifact events'; END IF;
          IF NEW.revision_number <> OLD.revision_number + 1 THEN
            RAISE EXCEPTION 'An event update requires the next revision';
          END IF;
          RETURN NEW;
        END $$""")
    op.execute(
        "CREATE TRIGGER require_revision BEFORE UPDATE OR DELETE ON deformation_events "
        "FOR EACH ROW EXECUTE FUNCTION require_event_revision()"
    )


def downgrade():
    if op.get_bind().scalar(sa.text("SELECT EXISTS (SELECT 1 FROM deformation_events)")):
        raise RuntimeError("Event history exists; preserve it before downgrading")
    op.drop_constraint("event_current_revision", "deformation_events", type_="foreignkey")
    op.drop_index(op.f("ix_event_evidence_event_id"), table_name="event_evidence")
    op.drop_table("event_evidence")
    op.drop_index(op.f("ix_event_observations_product_id"), table_name="event_observations")
    op.drop_index(op.f("ix_event_observations_event_id"), table_name="event_observations")
    op.drop_table("event_observations")
    op.drop_index(op.f("ix_event_revisions_event_id"), table_name="event_revisions")
    op.drop_index("idx_event_revisions_geom", table_name="event_revisions", postgresql_using="gist")
    op.drop_table("event_revisions")
    op.drop_index(op.f("ix_deformation_events_status"), table_name="deformation_events")
    op.drop_index(op.f("ix_deformation_events_publication"), table_name="deformation_events")
    op.drop_index(
        "idx_deformation_events_geom", table_name="deformation_events", postgresql_using="gist"
    )
    op.drop_table("deformation_events")
    op.execute("DROP FUNCTION require_event_revision()")
    op.execute("DROP FUNCTION preserve_event_history()")
