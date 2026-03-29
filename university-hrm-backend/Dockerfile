# ── Base image ────────────────────────────────────────────────────────────────
FROM python:3.13-slim

# ── Set working directory ──────────────────────────────────────────────────────
WORKDIR /app

# ── Install system dependencies ────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ── Copy requirements first (for Docker layer caching) ────────────────────────
COPY requirements.txt .

# ── Install Python dependencies ────────────────────────────────────────────────
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy the rest of the app ───────────────────────────────────────────────────
COPY . .

# ── Expose the port FastAPI runs on ───────────────────────────────────────────
EXPOSE 8000

# ── Start the app ─────────────────────────────────────────────────────────────
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]