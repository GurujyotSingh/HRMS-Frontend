import asyncio
from sqlalchemy import create_engine, inspect

# Assuming standard local postgres
engine = create_engine('postgresql://postgres:postgres@localhost:5432/hrms')
inspector = inspect(engine)

for table_name in ['users', 'user_financials', 'user_employments']:
    print(f"Table: {table_name}")
    try:
        for constraint in inspector.get_unique_constraints(table_name):
            print(f"  Unique: {constraint['column_names']}")
        for fk in inspector.get_foreign_keys(table_name):
            print(f"  FK: {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
    except Exception as e:
        print(f"  Error: {e}")
