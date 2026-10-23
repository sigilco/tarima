import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import * as v from "valibot";
import * as m from "../../paraglide/messages.js";
import { createProject, UnauthorizedError, unwrap } from "../../lib/api";
import { fetchProjectsFn } from "../../lib/api-server";

/**
 * /app (Stage 5, T5.2): the project list and the new-project form.
 *
 * The loader fetches the projects on the server (SSR) and hands the
 * payload to the component; a 401 means "no session", so the loader
 * redirects to /login.
 */

export const Route = createFileRoute("/app/")({
  loader: async () => {
    try {
      return unwrap(await fetchProjectsFn());
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw redirect({ to: "/login", search: { step: "email", email: "" } });
      }
      throw error;
    }
  },
  component: AppHome,
});

const nameSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200));

function AppHome() {
  const { projects } = Route.useLoaderData();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = v.safeParse(nameSchema, name);
    if (!parsed.success) {
      setError(m["login.invalidEmail"]());
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { project } = await createProject(parsed.output);
      await navigate({
        to: "/app/p/$projectId",
        params: { projectId: project.id },
        search: { filter: undefined, row: undefined, csv: undefined },
      });
    } catch {
      setError(m["errors.offline"]());
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grain min-h-[100dvh] bg-surface px-5 py-10 text-content lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/mark.png" alt="" className="h-5 w-5 rounded-[5px]" />
            <span className="font-display text-[19px] tracking-tight text-content">
              {m["app.title"]()}
            </span>
          </a>
          <span className="text-[13px] text-content-faint">{m["app.projects"]()}</span>
        </header>

        <h1 className="mt-12 font-display text-4xl leading-tight text-content">
          {m["app.projects"]()}
        </h1>

        <form
          onSubmit={onCreate}
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-raised p-4 sm:flex-row"
        >
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={m["app.newProjectName"]()}
            aria-label={m["app.newProjectName"]()}
            className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface px-4 py-2.5 text-[15px] text-content outline-none placeholder:text-content-faint focus:border-content-faint"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-full bg-content px-5 py-2.5 text-[14px] font-medium text-surface transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.4,1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {m["app.newProjectSubmit"]()}
          </button>
        </form>
        {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}

        {projects.length === 0 ? (
          <p className="mt-12 text-[14px] text-content-muted">{m["app.empty"]()}</p>
        ) : (
          <ul className="mt-10 space-y-2">
            {projects.map((project) => (
              <li key={project.id}>
                <a
                  href={`/app/p/${project.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-raised px-5 py-4 transition-colors hover:bg-surface-sunken"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium text-content">
                      {project.name}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-content-faint">
                      {new Date(project.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] text-content-muted">
                    {m["app.openBoard"]()}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
