import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "../components/Nav";
import { Hero } from "../components/landing/Hero";

export const Route = createFileRoute("/")({ component: Landing });

/** One-section landing: nav + hero, nothing below the fold. */
function Landing() {
  return (
    <div className="min-h-[100dvh] overflow-x-clip bg-paper text-ink">
      <Nav />
      <Hero />
    </div>
  );
}
