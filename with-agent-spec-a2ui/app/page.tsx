"use client";

import { CopilotChat, CopilotKitProvider } from "@copilotkit/react-core/v2";
import { createA2UIMessageRenderer } from "@copilotkit/a2ui-renderer";
import { theme } from "./theme";
import PatchedCopilotChatMessageView from "./components/PatchedCopilotChatMessageView";

// Disable static optimization for this page
export const dynamic = "force-dynamic";

const A2UIMessageRenderer = createA2UIMessageRenderer({ theme });
const activityRenderers = [A2UIMessageRenderer];

// we need to patch CopilotChatMessageView
// because otherwise it would not work
// Encountered two children with the same key, `run--69427337-9f71-40b3-9581-674bc5eff4c8-custom-before`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.

export default function Home() {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      showDevConsole="auto"
      renderActivityMessages={activityRenderers}
    >
      <main
        className="h-full w-screen overflow-auto"
        style={{ minHeight: "100dvh" }}
      >
        <CopilotChat className="h-full pb-28" messageView={PatchedCopilotChatMessageView} />
      </main>
    </CopilotKitProvider>
  );
}


// export default function Home() {
//   return (
//     <CopilotKitProvider
//       runtimeUrl="/api/copilotkit"
//       showDevConsole="auto"
//       renderActivityMessages={activityRenderers}
//     >
//       <main
//         className="h-full overflow-auto w-screen"
//         style={{ minHeight: "100dvh" }}
//       >
//         <CopilotChat className="h-full" />;
//       </main>
//     </CopilotKitProvider>
//   );
// }