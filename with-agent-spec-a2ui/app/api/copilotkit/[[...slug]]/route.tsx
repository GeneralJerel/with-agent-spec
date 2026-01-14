import { CopilotRuntime, createCopilotEndpoint, InMemoryAgentRunner } from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";
import { handle } from "hono/vercel";
import { StaticA2UIAgent } from "../static-agent";

const staticAgent = new StaticA2UIAgent();
const agentSpecUrl = process.env.AGENT_SPEC_URL ?? "http://localhost:8000/";
const httpAgent = new HttpAgent({ url: agentSpecUrl });

const runtime = new CopilotRuntime({
  agents: {
    default: httpAgent,
    static: staticAgent,
  },
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotEndpoint({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handle(app);
export const POST = handle(app);
