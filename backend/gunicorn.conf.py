"""
Gunicorn configuration for CloudVuln FastAPI Backend Production Deployment.
"""
import multiprocessing
import os

# Server Socket
bind = os.getenv("BIND", "0.0.0.0:8000")
backlog = 2048

# Worker Processes
# Render/Linux container optimization
default_workers = max(2, multiprocessing.cpu_count() * 2 + 1)
workers = int(os.getenv("WORKERS", default_workers))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = "-"  # Write to stdout
errorlog = "-"   # Write to stderr
loglevel = os.getenv("LOG_LEVEL", "info").lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)ss'

# Process Naming
proc_name = "cloudvuln_gunicorn"

# Security & Restart Limits
max_requests = 1000
max_requests_jitter = 50
limit_request_line = 4094
limit_request_fields = 100
limit_request_fieldsize = 8190
