from __future__ import annotations

from ag_ui_agentspec.agent import AgentSpecAgent
from a2ui_from_llm import a2ui_llm_agent_json


def build_agentspec_agent(runtime: str = "langgraph") -> AgentSpecAgent:
    from restaurant_tool import get_restaurants
    return AgentSpecAgent(a2ui_llm_agent_json, runtime=runtime, tool_registry={"get_restaurants": get_restaurants})

