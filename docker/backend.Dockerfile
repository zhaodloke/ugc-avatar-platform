FROM python:3.10

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt ./backend-requirements.txt
RUN pip install --no-cache-dir -r backend-requirements.txt

# Copy application
COPY backend /app/backend
COPY worker /app/worker

# Set Python path (backend contains schemas and services)
ENV PYTHONPATH=/app:/app/backend

# Run server
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
