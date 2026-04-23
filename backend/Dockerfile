FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# wget/ca-certificates: for the VS Code server download
# procps: provides the 'ps' command for process management (Required by VS Code)
# libpq-dev/gcc: for PostgreSQL drivers (psycopg2)
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    libpq-dev \
    gcc \
    procps \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]