"""initial_catalog"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2
from sqlalchemy.dialects import postgresql
revision = '98916efed35d'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('areas_of_interest',
    sa.Column('slug', sa.String(), nullable=False),
    sa.Column('name_fa', sa.String(), nullable=False),
    sa.Column('name_en', sa.String(), nullable=False),
    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326, dimension=2, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=True),
    sa.Column('bbox', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('slug')
    )
    op.create_index('idx_areas_of_interest_geom', 'areas_of_interest', ['geom'], unique=False, postgresql_using='gist')
    op.create_table('processing_runs',
    sa.Column('aoi_id', sa.Uuid(), nullable=False),
    sa.Column('pipeline_version', sa.String(), nullable=False),
    sa.Column('git_sha', sa.String(), nullable=False),
    sa.Column('processing_profile', sa.String(), nullable=False),
    sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('parent_run_id', sa.Uuid(), nullable=True),
    sa.Column('log_uri', sa.String(), nullable=True),
    sa.Column('error', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("status IN ('created','discovering','submitting','processing','downloading','mintpy','qc','validation_required','publishing','published','failed','cancelled')", name='run_status'),
    sa.ForeignKeyConstraint(['aoi_id'], ['areas_of_interest.id'], ),
    sa.ForeignKeyConstraint(['parent_run_id'], ['processing_runs.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_processing_runs_aoi_id'), 'processing_runs', ['aoi_id'], unique=False)
    op.create_table('products',
    sa.Column('processing_run_id', sa.Uuid(), nullable=False),
    sa.Column('aoi_id', sa.Uuid(), nullable=False),
    sa.Column('kind', sa.String(), nullable=False),
    sa.Column('orbit_direction', sa.String(), nullable=False),
    sa.Column('relative_orbit', sa.Integer(), nullable=False),
    sa.Column('start_date', sa.String(), nullable=False),
    sa.Column('end_date', sa.String(), nullable=False),
    sa.Column('unit', sa.String(), nullable=False),
    sa.Column('crs', sa.String(), nullable=False),
    sa.Column('resolution_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('processing_version', sa.String(), nullable=False),
    sa.Column('stats', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('stac_item_id', sa.String(), nullable=False),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("kind IN ('velocity_los','temporal_coherence','velocity_uncertainty','valid_mask','timeseries')", name='product_kind'),
    sa.CheckConstraint("orbit_direction IN ('ascending','descending')", name='product_orbit'),
    sa.CheckConstraint("status IN ('draft','validated','published','superseded')", name='product_status'),
    sa.ForeignKeyConstraint(['aoi_id'], ['areas_of_interest.id'], ),
    sa.ForeignKeyConstraint(['processing_run_id'], ['processing_runs.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_aoi_id'), 'products', ['aoi_id'], unique=False)
    op.create_index(op.f('ix_products_processing_run_id'), 'products', ['processing_run_id'], unique=False)
    op.create_index(op.f('ix_products_status'), 'products', ['status'], unique=False)
    op.create_table('reference_points',
    sa.Column('processing_run_id', sa.Uuid(), nullable=False),
    sa.Column('method', sa.String(), nullable=False),
    sa.Column('reason', sa.String(), nullable=False),
    sa.Column('selected_by', sa.String(), nullable=False),
    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, dimension=2, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=True),
    sa.Column('stability_metrics', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['processing_run_id'], ['processing_runs.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_reference_points_geom', 'reference_points', ['geom'], unique=False, postgresql_using='gist')
    op.create_index(op.f('ix_reference_points_processing_run_id'), 'reference_points', ['processing_run_id'], unique=False)
    op.create_table('product_assets',
    sa.Column('product_id', sa.Uuid(), nullable=False),
    sa.Column('role', sa.String(), nullable=False),
    sa.Column('object_key', sa.String(), nullable=False),
    sa.Column('media_type', sa.String(), nullable=False),
    sa.Column('size_bytes', sa.Integer(), nullable=False),
    sa.Column('checksum_sha256', sa.String(length=64), nullable=False),
    sa.Column('etag', sa.String(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('object_key')
    )
    op.create_index(op.f('ix_product_assets_product_id'), 'product_assets', ['product_id'], unique=False)
    op.create_table('qc_metrics',
    sa.Column('processing_run_id', sa.Uuid(), nullable=False),
    sa.Column('product_id', sa.Uuid(), nullable=True),
    sa.Column('metric_name', sa.String(), nullable=False),
    sa.Column('value_number', sa.Float(), nullable=True),
    sa.Column('value_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('threshold', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('passed', sa.Boolean(), nullable=True),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['processing_run_id'], ['processing_runs.id'], ),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_qc_metrics_processing_run_id'), 'qc_metrics', ['processing_run_id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_qc_metrics_processing_run_id'), table_name='qc_metrics')
    op.drop_table('qc_metrics')
    op.drop_index(op.f('ix_product_assets_product_id'), table_name='product_assets')
    op.drop_table('product_assets')
    op.drop_index(op.f('ix_reference_points_processing_run_id'), table_name='reference_points')
    op.drop_index('idx_reference_points_geom', table_name='reference_points', postgresql_using='gist')
    op.drop_table('reference_points')
    op.drop_index(op.f('ix_products_status'), table_name='products')
    op.drop_index(op.f('ix_products_processing_run_id'), table_name='products')
    op.drop_index(op.f('ix_products_aoi_id'), table_name='products')
    op.drop_table('products')
    op.drop_index(op.f('ix_processing_runs_aoi_id'), table_name='processing_runs')
    op.drop_table('processing_runs')
    op.drop_index('idx_areas_of_interest_geom', table_name='areas_of_interest', postgresql_using='gist')
    op.drop_table('areas_of_interest')
