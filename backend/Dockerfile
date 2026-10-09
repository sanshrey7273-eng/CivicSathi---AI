FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (fonts for ReportLab PDF generation, curl for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-core \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
