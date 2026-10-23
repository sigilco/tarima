import { useEffect, useRef, useState } from "react";
import { RoughNotation } from "react-rough-notation";

/**
 * H1 with a rough-notation underline drawn on when scrolled into view.
 * Colors are literal hexes (rough-notation renders raw SVG, it cannot
 * read CSS variables). Reduced motion shows the annotation pre-drawn.
 */
export function AnnotatedHeadline({
  pre,
  accent,
  post,
}: {
  pre: string;
  accent: string;
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
      className="font-display text-[clamp(3rem,6vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink"
    >
      {pre}{" "}
      <RoughNotation
        type="underline"
        color="#a8421d"
        strokeWidth={5}
        padding={2}
        iterations={2}
        animationDuration={700}
        show={show}
      >
        <em className="not-italic">{accent}</em>
      </RoughNotation>{" "}
      {post}
    </h1>
  );
}
