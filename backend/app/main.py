from fastapi import FastAPI

app = FastAPI(title="WiseKey API")

@app.get("/health")
def health():
    return {"status": "ok"}
