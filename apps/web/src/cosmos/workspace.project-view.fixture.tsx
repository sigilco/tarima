import { ProjectView } from "#/components/workspace/ProjectView";

const project = { id: "p1", name: "Spring hackathon sponsors", stage: "spec_review" };
const entities = [
  {
    id: "e1",
    name: "Acme Corp",
    contact: "ops@acme.test",
    status: "replied",
    missing: ["vector logo"],
    updatedAt: "2026-11-03T10:00:00Z",
  },
  {
    id: "e2",
    name: "Lumen Studio",
    status: "intake",
    missing: ["deck", "slides"],
    updatedAt: "2026-11-02T09:00:00Z",
  },
  {
    id: "e3",
    name: "Ada Okoye",
    contact: "ada@example.com",
    status: "done",
    missing: [],
    updatedAt: "2026-11-01T09:00:00Z",
  },
];

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

export default {
  Populated: (
    <Frame>
      <ProjectView state="ready" project={project} entities={entities} />
    </Frame>
  ),
  Empty: (
    <Frame>
      <ProjectView state="ready" project={{ ...project, stage: "brief" }} entities={[]} />
    </Frame>
  ),
  Loading: (
    <Frame>
      <ProjectView state="loading" />
    </Frame>
  ),
  Error: (
    <Frame>
      <ProjectView state="error" />
    </Frame>
  ),
};
