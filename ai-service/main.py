from fastapi import FastAPI
from app.api import router as api_router

app = FastAPI(
    title="NeuralConsult Sevrage AI",
    version="0.1.0"
)

app.include_router(api_router, prefix="/api")
