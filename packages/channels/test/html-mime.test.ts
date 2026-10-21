import { describe, expect, it } from "vitest";
import { htmlToText } from "../src/html";
import { parseMime } from "../src/mime";

describe("htmlToText", () => {
  it("extracts block text with newlines between blocks", () => {
    expect(htmlToText("<div><p>Hello <b>world</b></p><p>Second</p></div>")).toBe(
      "Hello world\nSecond",
    );
  });

  it("decodes entities", () => {
    expect(htmlToText("<p>a &amp; b &lt;c&gt;</p>")).toBe("a & b <c>");
  });

  it("drops script and style contents", () => {
    const html = "<p>keep</p><script>alert(1)</script><style>body{}</style><p>me</p>";
    expect(htmlToText(html)).toBe("keep\nme");
  });

  it("collapses blank runs and trims", () => {
    expect(htmlToText("<p>a</p><br><br><br><p>   </p><p>b</p>")).toBe("a\nb");
  });

  it("returns an empty string for empty input", () => {
    expect(htmlToText("")).toBe("");
  });
});

const MIME_WITH_ATTACHMENT = [
  "From: Venue <venue@example.com>",
  "To: row-1@tarima.illo.fyi",
  "Reply-To: ops@example.com",
  "Subject: Invoice attached",
  "Message-ID: <m1@example.com>",
  'Content-Type: multipart/mixed; boundary="BOUND"',
  "",
  "--BOUND",
  "Content-Type: text/plain; charset=utf-8",
  "",
  "Here it is.",
  "--BOUND",
  'Content-Type: application/pdf; name="invoice.pdf"',
  'Content-Disposition: attachment; filename="invoice.pdf"',
  "Content-Transfer-Encoding: base64",
  "",
  "JVBERi0xLjQ=",
  "--BOUND--",
  "",
].join("\r\n");

describe("parseMime", () => {
  it("prefers the to address as the thread id", async () => {
    const parsed = await parseMime(MIME_WITH_ATTACHMENT);
    expect(parsed.threadId).toBe("row-1@tarima.illo.fyi");
    expect(parsed.to).toBe("row-1@tarima.illo.fyi");
    expect(parsed.from).toBe("venue@example.com");
    expect(parsed.replyTo).toBe("ops@example.com");
    expect(parsed.subject).toBe("Invoice attached");
    expect(parsed.text).toBe("Here it is.");
    expect(parsed.messageId).toBe("<m1@example.com>");
  });

  it("decodes attachments to buffers", async () => {
    const parsed = await parseMime(MIME_WITH_ATTACHMENT);
    expect(parsed.attachments).toHaveLength(1);
    const [att] = parsed.attachments!;
    expect(att!.filename).toBe("invoice.pdf");
    expect(att!.mimeType).toBe("application/pdf");
    expect(att!.bytes).toEqual(Buffer.from("JVBERi0xLjQ=", "base64"));
  });

  it("falls back to the from address when to is missing", async () => {
    const raw = [
      "From: someone@example.com",
      "Subject: hi",
      "Content-Type: text/plain",
      "",
      "body",
      "",
    ].join("\r\n");
    const parsed = await parseMime(raw);
    expect(parsed.threadId).toBe("someone@example.com");
  });

  it("keeps the whole parse as raw", async () => {
    const parsed = await parseMime(MIME_WITH_ATTACHMENT);
    expect(parsed.raw).toMatchObject({ subject: "Invoice attached" });
  });
});
