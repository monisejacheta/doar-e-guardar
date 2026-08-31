"""
Entrypoint para publicar o modelo de classificacao na nuvem.

Comando recomendado em plataformas como Render, Railway, Fly.io ou similares:
    gunicorn cloud_app:app --bind 0.0.0.0:$PORT

Para teste local:
    python cloud_app.py
"""

import os

from modelo_learnig import create_app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
