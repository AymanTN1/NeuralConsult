#!/usr/bin/env python3
from __future__ import annotations

import uvicorn

from backend.core import settings


def main():
    print("Demarrage de l'application ISIC...")
    print("Application    : http://127.0.0.1:8000/")
    print("Documentation  : http://127.0.0.1:8000/api/docs")
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
