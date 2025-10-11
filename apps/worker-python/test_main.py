from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Media Analyzer Worker Test", version="1.0.0")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "worker-python-test"}

@app.get("/")
async def root():
    return {"message": "Python worker is running!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
