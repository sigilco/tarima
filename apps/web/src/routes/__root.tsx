import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { OG_PREVIEW_URL } from "../lib/seo";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Tarima — the ops agent for events",
      },
      {
        name: "description",
        content:
          "Tarima is the back-office agent for event organizers. It calls venues and chases sponsors across email, phone and chat, and fills your board until every row is done.",
      },
      // The social card. The absolute URL is what crawlers need: a relative
      // path resolves against the page URL, which is wrong for a share.
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Tarima" },
      { property: "og:title", content: "Your event's ops agent is now on your phone" },
      {
        property: "og:description",
        content: "Brief it once. It chases every vendor for you.",
      },
      { property: "og:image", content: OG_PREVIEW_URL },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Tarima: your event's ops agent is now on your phone" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Your event's ops agent is now on your phone" },
      { name: "twitter:description", content: "Brief it once. It chases every vendor for you." },
      { name: "twitter:image", content: OG_PREVIEW_URL },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/mark.png",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <Scripts />
      </body>
    </html>
  );
}
