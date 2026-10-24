type MinimalFooterProps = {
  copyright?: string;
  links?: { label: string; href: string }[];
};

export function MinimalFooter({
  copyright = "© 2026 Aceternity AI. All rights reserved.",
  links = [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Documentation", href: "#" },
  ],
}: MinimalFooterProps) {
  return (
    <footer className="w-full border-t border-neutral-200/50 py-5 text-center text-xs text-neutral-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
        <p>{copyright}</p>
        <div className="flex items-center gap-4">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-neutral-600">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
