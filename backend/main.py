from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import engine
import models
from routers import auth, metrics

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Thriven API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(401)
async def unauthorized_handler(request: Request, exc):
    return JSONResponse(
        status_code=401,
        content={"detail": "Could not validate credentials"},
        headers={"Access-Control-Allow-Origin": "http://localhost:5173"},
    )

app.include_router(auth.router)
app.include_router(metrics.router)

@app.get("/")
def root():
    return {"message": "Thriven backend is running"}