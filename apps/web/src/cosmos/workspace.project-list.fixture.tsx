import { useState } from "react";

import { ProjectList } from "#/components/workspace/ProjectList";

const projects = [
  {
    id: "p1",
    name: "Spring hackathon sponsors",
    stage: "spec_review",
    createdAt: "2026-11-03T10:00:00Z",
  },
  { id: "p2", name: "Founder dinner Paris", stage: "brief", createdAt: "2026-11-02T09:00:00Z" },
];

function Harness({ initial }: { initial: "loading" | "error" | "ready" }) {
  const [state, setState] = useState(initial);
  return (
    <div className="min-h-[100dvh] bg-background p-8">
      <ProjectList
        state={state}
        projects={projects}
        onRetry={() => setState("ready")}
        onOpen={() => {}}
        onCreate={async () => {
          await new Promise((r) => setTimeout(r, 400));
          setState("ready");
        }}
      />
    </div>
  );
}

function EmptyHarness() {
  return (
    <div className="min-h-[100dvh] bg-background p-8">
      <ProjectList state="ready" projects={[]} onOpen={() => {}} onCreate={async () => {}} />
    </div>
  );
}

export default {
  Loading: <Harness initial="loading" />,
  Populated: <Harness initial="ready" />,
  Error: <Harness initial="error" />,
  Empty: <EmptyHarness />,
};
