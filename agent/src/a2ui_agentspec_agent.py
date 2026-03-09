from __future__ import annotations

import os

import dotenv
dotenv.load_dotenv()

from pyagentspec.agent import Agent
from pyagentspec.llms import OpenAiCompatibleConfig
from pyagentspec.serialization import AgentSpecSerializer
from pyagentspec.tools import ServerTool, ClientTool
from pyagentspec.property import StringProperty
from pyagentspec.llms.openaiconfig import OpenAIAPIType
from pyagentspec.llms.llmgenerationconfig import LlmGenerationConfig
from pathlib import Path
import json

a2ui_prompts_folder = Path(__file__).resolve().parent / "a2ui_prompts"
A2UI_JSON_SCHEMA = (a2ui_prompts_folder / "a2ui_schema.json").read_text(encoding="utf-8")
A2UI_PROMPT = (a2ui_prompts_folder / "a2ui_prompt.txt").read_text(encoding="utf-8")

A2UI_JSON_SCHEMA_PROMPT = f"""
# JSON Schema Reference
---BEGIN A2UI JSON SCHEMA---
{A2UI_JSON_SCHEMA}
---END A2UI JSON SCHEMA---
"""

a2ui_email_component_json = (a2ui_prompts_folder / "email_form.json").read_text(encoding="utf-8")
a2ui_email_update_json = (a2ui_prompts_folder / "email_form_update.json").read_text(encoding="utf-8")


A2UI_SYSTEM_PROMPT = f"""You are a helpful Scheduling Assistant that helps users manage their calendar and emails.

Today's date: 2026-02-02 (Monday). When the user asks a question without a specific date, assume they mean today.

# Rendering Rules

## Calendar Display
When the user asks to see their schedule or calendar:
1. First call get_user_schedule to retrieve the schedule data.
2. Then call render_calendar with:
   - date: today's date "2026-02-02"
   - dayName: "Monday"
   - events: a JSON array STRING where each object has:
     - "startTime": start time like "08:00"
     - "endTime": end time like "09:00" (or "" if open-ended)
     - "title": the event name
     - "isAvailable": true if the slot is available, false otherwise

   Example events value: '[{{"startTime":"08:00","endTime":"09:00","title":"Morning Meeting","isAvailable":false}},{{"startTime":"09:00","endTime":"10:00","title":"Available","isAvailable":true}}]'

3. DO NOT use send_a2ui_json_to_client for calendar display. Always use render_calendar.
4. When updating the schedule (adding/removing events), call render_calendar again with the FULL updated event list.

## Inbox Display
When the user asks to check their inbox or emails:
1. First call check_user_inbox to retrieve emails.
2. Then call render_inbox with:
   - emails: a JSON array STRING where each object has:
     - "from": sender email address
     - "subject": email subject line
     - "body": email body text
     - "date": date/time string
     - "isRead": boolean (false for unread)

   Example emails value: '[{{"from":"david@company.org","subject":"Quick Sync","body":"Hey, need to set up a meeting...","date":"10:30 AM","isRead":false}}]'

3. DO NOT use send_a2ui_json_to_client for inbox display. Always use render_inbox.

## Email Compose
When composing, drafting, or sending an email, use the send_a2ui_json_to_client tool with the A2UI email form component below. This is the ONLY case where send_a2ui_json_to_client should be used.

{A2UI_PROMPT}

{A2UI_JSON_SCHEMA_PROMPT}

---BEGIN EMAIL FORM COMPONENT EXAMPLE---
{a2ui_email_component_json}
---END EMAIL FORM COMPONENT EXAMPLE---

---BEGIN EMAIL FORM DATA UPDATE EXAMPLE---
{a2ui_email_update_json}
---END EMAIL FORM DATA UPDATE EXAMPLE---

# Reminders
- For calendar: use get_user_schedule then render_calendar
- For inbox: use check_user_inbox then render_inbox
- For composing emails: use send_a2ui_json_to_client with the email form A2UI component
- Always generate valid JSON with double-quoted property names
- When updating the schedule, include ALL events in the render_calendar call (existing + new)
"""

agent_llm = OpenAiCompatibleConfig(
    name="my_llm",
    model_id=os.environ.get("OPENAI_MODEL", "gpt-5.2"),
    url=os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"),
    api_type=OpenAIAPIType.RESPONSES,
    default_generation_parameters=LlmGenerationConfig(reasoning={"effort": "none"})
)

send_a2ui_json_to_client_tool = ClientTool(
    name="send_a2ui_json_to_client",
    description="Sends A2UI JSON to the client to render rich UI for the user. " +
    "Only use this for rendering the email compose form. " +
    "The A2UI JSON Schema definition is between ---BEGIN A2UI JSON SCHEMA--- and ---END A2UI JSON SCHEMA--- in the system instructions.",
    inputs=[StringProperty(title="a2ui_json", description="Valid A2UI JSON Schema to send to the client.")]
)

render_calendar_tool = ClientTool(
    name="render_calendar",
    description="Renders a rich calendar day-view on the client. "
    "Call this after retrieving the user's schedule with get_user_schedule. "
    "Pass the date, day name, and events as a JSON array string.",
    inputs=[
        StringProperty(title="date", description="The date, e.g. '2026-02-02'"),
        StringProperty(title="dayName", description="The day name, e.g. 'Monday'"),
        StringProperty(title="events", description="JSON array string of event objects with startTime, endTime, title, isAvailable fields"),
    ]
)

render_inbox_tool = ClientTool(
    name="render_inbox",
    description="Renders a Gmail-style inbox view on the client. "
    "Call this after checking the user's inbox with check_user_inbox. "
    "Pass the emails as a JSON array string.",
    inputs=[
        StringProperty(title="emails", description="JSON array string of email objects with from, subject, body, date, isRead fields"),
    ]
)

check_user_inbox_tool = ServerTool(
    name="check_user_inbox",
    description="Checks the user's inbox. Returns a JSON array of emails. Optionally searches based on keywords.",
    inputs=[StringProperty(title="search_query")],
    outputs=[StringProperty(title="email_content")],
)

get_user_schedule_tool = ServerTool(
    name="get_user_schedule",
    description="Retrieves the user's schedule for today. Returns a JSON array of time slots with events.",
)

send_email_tool = ServerTool(
    name="send_email",
    description="Sends an email out. Accepts a single argument as the entire email, including the sender, recipients, subject, body, etc.",
    inputs=[StringProperty(title="payload")]
)

agent = Agent(
    name="a2ui_chat_agent",
    llm_config=agent_llm,
    system_prompt=A2UI_SYSTEM_PROMPT,
    tools=[
        send_a2ui_json_to_client_tool,
        render_calendar_tool,
        render_inbox_tool,
        check_user_inbox_tool,
        get_user_schedule_tool,
        send_email_tool,
    ]
)

a2ui_chat_json = AgentSpecSerializer().to_json(agent)

demo_schedule = [
    {"startTime": "08:00", "endTime": "09:00", "title": "Morning Meeting", "isAvailable": False},
    {"startTime": "09:00", "endTime": "10:00", "title": "Project Work", "isAvailable": False},
    {"startTime": "10:00", "endTime": "11:00", "title": "Available", "isAvailable": True},
    {"startTime": "11:00", "endTime": "11:30", "title": "Client Call", "isAvailable": False},
    {"startTime": "12:00", "endTime": "13:00", "title": "Lunch Break", "isAvailable": False},
    {"startTime": "13:00", "endTime": "14:00", "title": "Available", "isAvailable": True},
    {"startTime": "14:00", "endTime": "15:00", "title": "Team Sync", "isAvailable": False},
    {"startTime": "15:00", "endTime": "16:00", "title": "Available", "isAvailable": True},
    {"startTime": "16:00", "endTime": "16:30", "title": "Report Review", "isAvailable": False},
    {"startTime": "17:00", "endTime": "", "title": "Available", "isAvailable": True},
]

demo_inbox = [
    {
        "from": "david.dave@company.org",
        "subject": "Quick Sync",
        "body": "Hey, I need to loop you in with some colleagues for a meeting to set up a new project. When would you be available? Please reply asap",
        "date": "10:30 AM",
        "isRead": False,
    },
    {
        "from": "sarah.chen@company.org",
        "subject": "Q1 Report Review",
        "body": "Hi team, I've attached the Q1 report for your review. Please take a look before our meeting on Thursday and come prepared with feedback.",
        "date": "9:15 AM",
        "isRead": False,
    },
    {
        "from": "mike.johnson@company.org",
        "subject": "Lunch plans?",
        "body": "Anyone up for trying that new sushi place on 5th street? I heard they have great lunch specials this week.",
        "date": "Yesterday",
        "isRead": True,
    },
    {
        "from": "hr@company.org",
        "subject": "Benefits Enrollment Reminder",
        "body": "This is a reminder that open enrollment for benefits closes on February 15th. Please review your options in the employee portal.",
        "date": "Yesterday",
        "isRead": True,
    },
    {
        "from": "jessica.park@company.org",
        "subject": "Design Review Feedback",
        "body": "Great work on the new dashboard mockups! I have a few suggestions for the navigation layout that I think could improve the UX.",
        "date": "Feb 1",
        "isRead": True,
    },
]


def user_schedule_tool(*args, **kwargs):
    return json.dumps(demo_schedule)


def check_inbox_tool(*args, **kwargs):
    return json.dumps(demo_inbox)


def send_email_tool_fn(*args, **kwargs):
    return "Email sent successfully!"


a2ui_demo_tool_registry = {
    "check_user_inbox": check_inbox_tool,
    "get_user_schedule": user_schedule_tool,
    "send_email": send_email_tool_fn,
}
