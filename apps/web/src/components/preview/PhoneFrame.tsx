import type { ReactNode } from "react";

/**
 * Phone mockup shell for the hero preview. Pure presentation: a rounded
 * bezel with a tonal hairline (Auralis layering, no shadows) around an
 * overflow-hidden screen where the preview variations render.
 */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width: 300,
        aspectRatio: "9 / 19",
        borderRadius: 44,
        border: "1px solid var(--color-line)",
        outline: "2px solid var(--color-ink)",
        outlineOffset: 2,
        padding: 3,
        boxSizing: "border-box",
        background: "var(--color-paper)",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 40,
          overflow: "hidden",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <StatusBar />
        <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}

/** Minimal 9:41 status bar: time left, signal + battery shapes right. */
function StatusBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px 6px",
        fontFamily: "var(--font-sans)",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--color-ink)",
      }}
    >
      <span>9:41</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {/* signal: 4 ascending bars */}
        <span style={{ display: "flex", alignItems: "flex-end", gap: 1.5 }}>
          {[3, 5, 7, 9].map((h) => (
            <span
              key={h}
              style={{ width: 2.5, height: h, borderRadius: 1, background: "var(--color-ink)" }}
            />
          ))}
        </span>
        {/* battery: outline + fill */}
        <span
          style={{
            position: "relative",
            width: 20,
            height: 10,
            border: "1px solid var(--color-ink-2)",
            borderRadius: 3,
            padding: 1.5,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              display: "block",
              width: "70%",
              height: "100%",
              borderRadius: 1,
              background: "var(--color-ink)",
            }}
          />
        </span>
      </span>
    </div>
  );
}
