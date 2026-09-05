from alembic import context
from forudid_api.db import Base, engine

if context.is_offline_mode():
    raise RuntimeError("Migrations require the configured PostGIS database")
with engine().connect() as connection:
    context.configure(connection=connection, target_metadata=Base.metadata,
                      include_object=lambda obj, name, type_, reflected, compare_to:
                      not (type_ == "table" and reflected and compare_to is None))
    with context.begin_transaction():
        context.run_migrations()
