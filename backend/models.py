from sqlalchemy import Column, Integer, String, DateTime, Date, JSON
from sqlalchemy.sql import func
from database import Base

class Startup(Base):
    __tablename__ = "startups"

    id = Column(Integer, primary_key=True, index=True)
    startup_name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MetricsUpload(Base):
    __tablename__ = "metrics_uploads"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, unique=True, index=True)
    row_data = Column(JSON)  # list of CSV row dicts, same shape as df.to_dict('records')
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BenchmarkBaseline(Base):
    __tablename__ = "benchmark_baselines"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, unique=True, index=True)
    baseline = Column(JSON)
    current = Column(JSON)
    last_drift_date = Column(Date)
    day_count = Column(Integer, default=0)
    history = Column(JSON)  # list of dicts


class PublicPage(Base):
    __tablename__ = "public_pages"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    user_email = Column(String, unique=True, index=True)
    startup_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())