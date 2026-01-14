from __future__ import annotations

import os

from pyagentspec.agent import Agent
from pyagentspec.llms import OpenAiCompatibleConfig
from pyagentspec.serialization import AgentSpecSerializer
from pyagentspec.tools import ServerTool
from pyagentspec.property import Property

from prompt_builder import get_ui_prompt, RESTAURANT_UI_EXAMPLES


agent_llm = OpenAiCompatibleConfig(
    name="a2ui_llm",
    model_id=os.environ.get("OPENAI_MODEL", "gpt-4o"),
    url=os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"),
)


AGENT_INSTRUCTION = """
    You are a helpful restaurant finding assistant. Your goal is to help users find and book restaurants using a rich UI.

    To achieve this, you MUST follow this logic:

    1.  **For finding restaurants:**
        a. You MUST call the `get_restaurants` tool. Extract the cuisine, location, and a specific number (`count`) of restaurants from the user's query (e.g., for "top 5 chinese places", count is 5).
        b. After receiving the data, you MUST follow the instructions precisely to generate the final a2ui UI JSON, using the appropriate UI example from the `prompt_builder.py` based on the number of restaurants.

    2.  **For booking a table (when you receive a query like 'USER_WANTS_TO_BOOK...'):**
        a. You MUST use the appropriate UI example from `prompt_builder.py` to generate the UI, populating the `dataModelUpdate.contents` with the details from the user's query.

    3.  **For confirming a booking (when you receive a query like 'User submitted a booking...'):**
        a. You MUST use the appropriate UI example from `prompt_builder.py` to generate the confirmation UI, populating the `dataModelUpdate.contents` with the final booking details.
"""


agent = Agent(
    name="a2ui_llm_agent",
    description="LLM that emits A2UI operations in a two-part response.",
    system_prompt= AGENT_INSTRUCTION + get_ui_prompt("http://localhost:8000", RESTAURANT_UI_EXAMPLES),
    llm_config=agent_llm,
    tools=[
        ServerTool(
            name="get_restaurants",
            description="Get a list of restaurants by cuisine and location.",
            inputs=[
                Property(
                    title="cuisine",
                    json_schema={"title": "cuisine", "type": "string"},
                ),
                Property(
                    title="location",
                    json_schema={"title": "location", "type": "string"},
                ),
                Property(
                    title="count",
                    json_schema={"title": "count", "type": "number"},
                ),
            ],
            outputs=[
                Property(
                    title="restaurants",
                    json_schema={"title": "restaurants", "type": "string"},
                )
            ],
        )
    ],
)


a2ui_llm_agent_json = AgentSpecSerializer().to_json(agent)
