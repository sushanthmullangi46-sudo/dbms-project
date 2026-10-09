from app.main import app

# Export ASGI app instance for Vercel Serverless / Service runtime
__all__ = ["app"]
