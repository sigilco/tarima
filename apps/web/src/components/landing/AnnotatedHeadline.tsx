import { useEffect, useRef, useState } from "react";
import { RoughNotation } from "react-rough-notation";

/**
 * H1 with hand-drawn annotations (marker highlight + underline) that draw
 * themselves once the headline enters the viewport.
 *
 * Colors are literal hexes: rough-notation renders raw SVG and cannot read
 * CSS variables. Reduced motion shows the annotations pre-drawn.
 */
export function AnnotatedHeadline({
  pre,
  accent,
  accent2,
  post,
}: {
  pre: string;
  accent: string;
  accent2: string;
  post: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // small beat after the headline fades in
            window.setTimeout(() => setShow(true), 600);
            io.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <h1
      ref={ref}
      className="font-display text-[clamp(2.75rem,5.6vw,4.75rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-balance text-ink"
    >
      {pre}{" "}
      <RoughNotation
        type="highlight"
        color="#f2e8cd"
        strokeWidth={2.5}
        padding={2}
        iterations={2}
        animationDuration={900}
        show={show}
      >
        <span className="not-italic">{accent}</span>
      </RoughNotation>{" "}
      <RoughNotation
        type="underline"
        color="#a8421d"
        strokeWidth={5}
        padding={2}
        iterations={2}
        animationDuration={700}
        show={show}
      >
        <span className="not-italic">{accent2}</span>
      </RoughNotation>{" "}
      {post}
    </h1>
  );
}
