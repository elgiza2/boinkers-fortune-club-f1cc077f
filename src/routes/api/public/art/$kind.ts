import { createFileRoute } from "@tanstack/react-router";

// Serves the newest AI-made Holo picture of a kind (splash, post, notify, event-<key>). Public, read-only artwork.
export const Route = createFileRoute("/api/public/art/$kind")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[a-z0-9-]{2,40}$/.test(params.kind)) return new Response("Bad kind", { status: 400 });
        const { db } = await import("@/lib/holo/admin.server");
        const { data } = await (await db()).from("holo_art").select("mime,data_b64").eq("kind", params.kind).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!data) return new Response("Not found", { status: 404 });
        const bin = Uint8Array.from(atob(data.data_b64), (c) => c.charCodeAt(0));
        return new Response(bin, { headers: { "content-type": data.mime, "cache-control": "public, max-age=3600" } });
      },
    },
  },
});
