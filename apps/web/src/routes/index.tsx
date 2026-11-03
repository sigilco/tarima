import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as m from "../paraglide/messages.js";
import { PlayfulHero, type PlayfulHeroCopy } from "../components/landing/playful/PlayfulHero";
import { MinimalFooter } from "../components/landing/playful/MinimalFooter";
import { Toast } from "../components/landing/playful/Toast";
import { useFitToViewport } from "../components/landing/playful/useFitToViewport";

export const Route = createFileRoute("/")({ component: PlayfulLanding });

const HERO_COPY: PlayfulHeroCopy = {
  headlineLine1: m["playful.headline.line1"](),
  headlineMarker: m["playful.headline.marker"](),
  headlineLine2: m["playful.headline.line2"](),
  headlineScribble: m["playful.headline.scribble"](),
  subtitleBefore: m["playful.subtitle.before"](),
  subtitleHighlight: m["playful.subtitle.highlight"](),
  subtitleAfter: m["playful.subtitle.after"](),
  ctaLabel: m["playful.cta.label"](),
  ghostLabel: m["playful.ghost.label"](),
  rating: m["playful.rating.value"](),
  ratingNote: m["playful.rating.note"](),
  statusTime: m["playful.phone.statusTime"](),
  phone: {
    userMessage: m["playful.phone.userMessage"](),
    userMeta: m["playful.phone.userMeta"](),
    agentMessage: m["playful.phone.agentMessage"](),
    agentMeta: m["playful.phone.agentMeta"](),
    board: {
      title: m["playful.phone.board.title"](),
      filled: m["playful.phone.board.filled"]({ count: 9 }),
      rows: [
        {
          name: m["playful.phone.board.row1.name"](),
          kind: m["playful.phone.board.row1.kind"](),
          status: m["playful.phone.board.row1.status"](),
        },
        {
          name: m["playful.phone.board.row2.name"](),
          kind: m["playful.phone.board.row2.kind"](),
          status: m["playful.phone.board.row2.status"](),
        },
        {
          name: m["playful.phone.board.row3.name"](),
          kind: m["playful.phone.board.row3.kind"](),
          status: m["playful.phone.board.row3.status"](),
        },
      ],
    },
    quickPrompts: [
      {
        label: m["playful.phone.prompt.sponsors"](),
        text: m["playful.phone.prompt.sponsorsText"](),
      },
      { label: m["playful.phone.prompt.venues"](), text: m["playful.phone.prompt.venuesText"]() },
    ],
    inputPlaceholder: m["playful.phone.inputPlaceholder"](),
    replyDefault: m["playful.phone.reply.default"](),
    replyMeetings: m["playful.phone.reply.sponsors"](),
    replyTrip: m["playful.phone.reply.venues"](),
    replyMeta: m["playful.phone.replyMeta"](),
  },
};

const FOOTER_LINKS = [
  { label: m["playful.footer.privacy"](), href: "#" },
  { label: m["playful.footer.terms"](), href: "#" },
];

/** Reach out: a real destination works before the platform routes land. */
const REACH_OUT_HREF = "mailto:hello@tarima.app?subject=Tarima%20early%20access";

function PlayfulLanding() {
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mainRef, footerRef, leftRef, titleRef, phoneBoxRef, phoneRef } = useFitToViewport();

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3500);
  };

  return (
    <div className="playful-root flex min-h-screen flex-col justify-between bg-[#FAFAFA] text-neutral-900 antialiased selection:bg-[#FACC15] selection:text-black">
      {/* Hero Section */}
      <main
        ref={mainRef}
        className="flex w-full flex-1 items-center justify-center overflow-hidden px-6 py-8 lg:py-16"
      >
        <PlayfulHero
          refs={{ leftRef, titleRef, phoneBoxRef, phoneRef }}
          copy={HERO_COPY}
          ctaHref="/login"
          ghostHref={REACH_OUT_HREF}
          onIslandClick={() => showToast(m["playful.toast.island"]())}
        />
      </main>

      <MinimalFooter
        ref={footerRef}
        copyright={m["playful.footer.copyright"]()}
        links={FOOTER_LINKS}
      />

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
