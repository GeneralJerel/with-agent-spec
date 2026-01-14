from ag_ui_agentspec.endpoint import add_agentspec_fastapi_endpoint
from fastapi import FastAPI
from starlette.staticfiles import StaticFiles
from pathlib import Path
import uvicorn

from agent import build_agentspec_agent


def build_server() -> FastAPI:
    app = FastAPI(title="Agent Spec A2UI Agent")
    agent = build_agentspec_agent(runtime="langgraph")
    add_agentspec_fastapi_endpoint(app, agent, path="/")
    # Serve demo images at /static from the Next.js public/images directory
    project_root = Path(__file__).resolve().parents[2]  # .../with-agent-spec-a2ui
    images_dir = project_root / "agent" / "images"
    if images_dir.exists():
        app.mount("/static", StaticFiles(directory=str(images_dir)), name="static")
    return app


app = build_server()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
