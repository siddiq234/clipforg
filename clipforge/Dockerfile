# ClipForge — single-container build (frontend + backend)
# Stage 1: build the React frontend
FROM node:20-slim AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend serving API + frontend dist
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HUB_CACHE=/app/backend/data/.hf-cache
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
# Frontend dist goes where app/main.py expects it: ../frontend/dist
COPY --from=frontend-build /build/dist /app/frontend/dist
EXPOSE 8000
VOLUME ["/app/backend/data"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
