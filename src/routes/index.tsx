import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/soulframe/Dashboard";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soulframe Codex — Envoy's Chronicle" },
      {
        name: "description",
        content:
          "A fan-made companion for Soulframe. Track your runes, pacts and weapons, then save your chronicle to a portable CSV memorystick.",
      },
      { property: "og:title", content: "Soulframe Codex — Envoy's Chronicle" },
      {
        property: "og:description",
        content: "Track your runes, pacts and weapons. Save and load your tale as a CSV.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Dashboard />
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
}
