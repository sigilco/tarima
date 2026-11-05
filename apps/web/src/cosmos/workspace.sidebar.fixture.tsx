import { Sidebar } from "#/components/workspace/Sidebar";

export default {
  Expanded: (
    <div className="flex h-[100dvh] bg-background">
      <Sidebar active="projects" userEmail="qa@tarima.test" />
    </div>
  ),
  Collapsed: (
    <div className="flex h-[100dvh] bg-background">
      <Sidebar active="projects" userEmail="qa@tarima.test" collapsed />
    </div>
  ),
  NoUser: (
    <div className="flex h-[100dvh] bg-background">
      <Sidebar active="projects" />
    </div>
  ),
};
