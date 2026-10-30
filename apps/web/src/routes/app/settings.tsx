import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import * as m from "../../paraglide/messages.js";
import {
  createConnectCode,
  markMessagesRead,
  removeBinding,
  UnauthorizedError,
  unwrap,
  type BindingChannel,
  type ConnectCodeWire,
} from "../../lib/api";
import { fetchInboxFn, fetchSettingsFn } from "../../lib/api-server";

/**
 * /app/settings (Stage B, channels stream): connect a channel, drop a
 * binding, read the notifications.
 *
 * The loader fetches the settings payload and the inbox on the server;
 * the actions call the same-origin endpoints from the browser.
 */

export const Route = createFileRoute("/app/settings")({
  loader: async () => {
    try {
      return { settings: unwrap(await fetchSettingsFn()), inbox: unwrap(await fetchInboxFn()) };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw redirect({ to: "/login", search: { step: "email", email: "" } });
      }
      throw error;
    }
  },
  component: Settings,
});

const CHANNEL_LABEL: Record<BindingChannel, string> = {
  telegram: m["settings.connectTelegram"](),
  whatsapp: m["settings.connectWhatsapp"](),
};

function Settings() {
  const { settings, inbox } = Route.useLoaderData();

  const [code, setCode] = useState<ConnectCodeWire | null>(null);
  const [codeChannel, setCodeChannel] = useState<BindingChannel>("telegram");
  const [messages, setMessages] = useState(inbox.messages);
  const [unread, setUnread] = useState(inbox.unread);
  const [bindings, setBindings] = useState(settings.bindings);

  async function onGenerate(channel: BindingChannel) {
    setCodeChannel(channel);
    try {
      setCode(await createConnectCode(channel));
    } catch {
      setCode(null);
    }
  }

  async function onUnbind(bindingId: string) {
    try {
      await removeBinding(bindingId);
      setBindings((current) => current.filter((b) => b.id !== bindingId));
    } catch {
      // Leave the row; the next reload shows the truth.
    }
  }

  async function onMarkAllRead() {
    try {
      const { unread: left } = await markMessagesRead();
      setUnread(left);
      setMessages((current) => current.map((msg) => ({ ...msg, read: true })));
    } catch {
      // Same as above: the reload corrects it.
    }
  }

  return (
    <main className="grain min-h-[100dvh] bg-surface px-5 py-10 text-content lg:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <a href="/app" className="flex items-center gap-2.5">
            <img src="/mark.png" alt="" className="h-5 w-5 rounded-[5px]" />
            <span className="font-display text-[19px] tracking-tight text-content">
              {m["app.title"]()}
            </span>
          </a>
          <span className="text-[13px] text-content-faint">{m["settings.title"]()}</span>
        </header>

        <h1 className="mt-12 font-display text-4xl leading-tight text-content">
          {m["settings.title"]()}
        </h1>
        <p className="mt-2 text-[14px] text-content-muted">{m["settings.subtitle"]()}</p>

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-content-faint">
            {m["settings.connectTelegram"]()} / {m["settings.connectWhatsapp"]()}
          </h2>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onGenerate("telegram")}
              className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content transition-colors hover:bg-surface-raised"
            >
              {m["settings.connectTelegram"]()}
            </button>
            <button
              type="button"
              onClick={() => onGenerate("whatsapp")}
              className="rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium text-content transition-colors hover:bg-surface-raised"
            >
              {m["settings.connectWhatsapp"]()}
            </button>
          </div>

          {code ? (
            <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-raised p-5">
              <p className="text-[12px] uppercase tracking-wide text-content-faint">
                {CHANNEL_LABEL[codeChannel]} {m["settings.codeLabel"]()}
              </p>
              <p className="mt-2 font-display text-4xl tracking-[0.3em] text-content">
                {code.code}
              </p>
              <p className="mt-3 text-[13px] text-content-muted">{m["settings.codeExpires"]()}</p>
              <p className="mt-1 text-[13px] text-content-muted">
                {codeChannel === "telegram"
                  ? m["settings.codeHintTelegram"]()
                  : m["settings.codeHintWhatsapp"]()}
              </p>
            </div>
          ) : null}
        </section>

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-content-faint">
            {m["settings.bindings"]()}
          </h2>
          {bindings.length === 0 ? (
            <p className="mt-3 text-[14px] text-content-muted">{m["settings.noBindings"]()}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {bindings.map((binding) => (
                <li
                  key={binding.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-content">
                      {CHANNEL_LABEL[binding.channel] ?? binding.channel}
                    </span>
                    <span className="block truncate text-[12.5px] text-content-faint">
                      {binding.externalId}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onUnbind(binding.id)}
                    className="shrink-0 rounded-full border border-border-subtle px-3 py-1.5 text-[12.5px] text-content-muted transition-colors hover:text-content"
                  >
                    {m["settings.unbind"]()}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-content-faint">
              {m["settings.inbox"]()}
              {unread > 0 ? (
                <span className="ml-2 rounded-full bg-content px-2 py-0.5 text-[11px] font-medium text-surface">
                  {unread} {m["settings.unread"]()}
                </span>
              ) : null}
            </h2>
            {unread > 0 ? (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="rounded-full border border-border-subtle px-3 py-1.5 text-[12.5px] text-content-muted transition-colors hover:text-content"
              >
                {m["settings.markAllRead"]()}
              </button>
            ) : null}
          </div>
          {messages.length === 0 ? (
            <p className="mt-3 text-[14px] text-content-muted">{m["settings.noMessages"]()}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className={`rounded-2xl border border-border-subtle px-4 py-3 ${
                    msg.read ? "bg-surface" : "bg-surface-raised"
                  }`}
                >
                  <p className="text-[14px] text-content">{msg.summary}</p>
                  <p className="mt-1 text-[12px] text-content-faint">
                    {new Date(msg.createdAt).toLocaleString("en-GB")}
                    {msg.read ? "" : ` - ${m["settings.unread"]()}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
