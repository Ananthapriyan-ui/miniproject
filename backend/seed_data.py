import models
from database import engine

def seed_database():
    """Ensure database tables exist without inserting fake/demo records."""
    models.Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    seed_database()
