import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { holoAdmin } from "@/lib/holo/holo.functions";
import { tgInitData } from "@/lib/game";

export const Route = createFileRoute("/101")({
  head: () => ({ meta: [{ title: "Holo Admin" }, { name: "robots", content: "noindex" }, { name: "description", content: "Holo admin panel" }, { property: "og:title", content: "Holo Admin" }, { property: "og:description", content: "Holo admin panel" }] }),
  component: AdminPage,
});

type Task = { id: string; title: string; url: string | null; kind: "link" | "join_channel" | "join_group"; chat_id: string | null; reward_spins: number; reward_tickets: number; reward_coins: number; active: boolean; sort: number };
type Data = Extract<Awaited<ReturnType<typeof holoAdmin>>, { ok: true }>;
const blank: Omit<Task, "id"> = { title: "", url: "", kind: "link", chat_id: null, reward_spins: 10, reward_tickets: 0, reward_coins: 0, active: true, sort: 10 };

function AdminPage() {
  const call = useServerFn(holoAdmin);
  const [data, setData] = useState<Data | null>(null);
  const [denied, setDenied] = useState(false);
  const [edit, setEdit] = useState<(Omit<Task, "id"> & { id: string | null }) | null>(null);
  const [newAdmin, setNewAdmin] = useState({ username: "", role: "tasks" as "owner" | "tasks" });

  const run = useCallback(async (op: Parameters<typeof holoAdmin>[0]["data"]["op"]) => {
    const initData = tgInitData();
    if (!initData) { setDenied(true); return; }
    const r = await call({ data: { initData, op } });
    if (!r.ok) { if (r.error === "Not allowed") setDenied(true); else toast.error(r.error); return; }
    setData(r);
  }, [call]);
  useEffect(() => { void run({ action: "overview" }); }, [run]);

  if (denied) return <div className="admin-page"><div className="admin-card text-center"><h1 className="text-xl font-bold">Not available</h1><p className="mt-1 text-sm text-muted-foreground">This page is for Holo admins inside Telegram.</p><Link to="/" className="admin-btn mt-4 inline-flex">Back to game</Link></div></div>;
  if (!data) return <div className="admin-page"><p className="text-center text-sm text-muted-foreground">Loading…</p></div>;
  const tasks = data.tasks as Task[];

  return (
    <div className="admin-page">
      <header className="flex items-center gap-3">
        <Link to="/" className="admin-icon" aria-label="Back"><ArrowLeft size={18} /></Link>
        <div><h1 className="text-2xl font-extrabold tracking-tight">Holo Admin</h1><p className="text-xs text-muted-foreground">{data.role === "owner" ? "Full access" : "Tasks manager"}</p></div>
      </header>

      {data.stats && (
        <section className="grid grid-cols-2 gap-2">
          {[["Players", data.stats.players], ["Active 24h", data.stats.active24], ["Joined channel", data.stats.joinedCh], ["Joined group", data.stats.joinedGr], ["Stars earned", data.stats.stars], ["GRAM earned", data.stats.gram]].map(([k, v]) => (
            <div key={k as string} className="admin-card"><p className="text-xs text-muted-foreground">{k}</p><p className="text-2xl font-extrabold">{Number(v).toLocaleString()}</p></div>
          ))}
        </section>
      )}

      <section className="admin-card space-y-2">
        <div className="flex items-center justify-between"><h2 className="font-bold">Tasks</h2><button className="admin-btn" onClick={() => setEdit({ id: null, ...blank })}><Plus size={14} /> Add</button></div>
        {tasks.map((t) => (
          <div key={t.id} className="admin-row">
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{t.title}{!t.active && <span className="ml-1 text-xs text-muted-foreground">(off)</span>}</p>
              <p className="truncate text-xs text-muted-foreground">{t.kind} · +{t.reward_spins} spins · +{t.reward_tickets} wheel · +{t.reward_coins} coins</p></div>
            <button className="admin-icon" aria-label="Edit task" onClick={() => setEdit({ ...t })}><Pencil size={14} /></button>
            <button className="admin-icon" aria-label="Delete task" onClick={() => { if (confirm(`Delete "${t.title}"?`)) void run({ action: "deleteTask", id: t.id }); }}><Trash2 size={14} /></button>
          </div>
        ))}
      </section>

      {edit && (
        <section className="admin-card space-y-2">
          <h2 className="font-bold">{edit.id ? "Edit task" : "New task"}</h2>
          <input className="admin-input" placeholder="Title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          <input className="admin-input" placeholder="Link (https://…)" value={edit.url ?? ""} onChange={(e) => setEdit({ ...edit, url: e.target.value })} />
          <select className="admin-input" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as Task["kind"] })}>
            <option value="link">Open link</option><option value="join_channel">Join channel (verified)</option><option value="join_group">Join group (verified)</option>
          </select>
          {edit.kind !== "link" && <input className="admin-input" placeholder="@channel username" value={edit.chat_id ?? ""} onChange={(e) => setEdit({ ...edit, chat_id: e.target.value })} />}
          <div className="grid grid-cols-3 gap-2">
            {(["reward_spins", "reward_tickets", "reward_coins"] as const).map((k) => (
              <label key={k} className="text-xs text-muted-foreground">{k.replace("reward_", "")}<input type="number" min={0} className="admin-input" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: Number(e.target.value) || 0 })} /></label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active</label>
          <div className="flex gap-2">
            <button className="admin-btn flex-1" onClick={async () => { const { id, ...task } = edit; await run({ action: "saveTask", id, task: { ...task, url: task.url || null, chat_id: task.kind === "link" ? null : task.chat_id } }); setEdit(null); toast.success("Saved"); }}>Save</button>
            <button className="admin-btn admin-btn-ghost flex-1" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </section>
      )}

      {data.role === "owner" && (
        <>
          <section className="admin-card space-y-2">
            <h2 className="font-bold">Admins</h2>
            {data.admins.map((a) => (
              <div key={a.username as string} className="admin-row"><p className="flex-1 font-semibold">@{a.username as string} <span className="text-xs text-muted-foreground">{a.role === "owner" ? "full" : "tasks only"}</span></p>
                <button className="admin-icon" aria-label="Remove admin" onClick={() => void run({ action: "removeAdmin", username: a.username as string })}><Trash2 size={14} /></button></div>
            ))}
            <div className="flex gap-2">
              <input className="admin-input flex-1" placeholder="@username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} />
              <select className="admin-input w-28" value={newAdmin.role} onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as "owner" | "tasks" })}><option value="tasks">Tasks</option><option value="owner">Full</option></select>
            </div>
            <button className="admin-btn w-full" onClick={async () => { await run({ action: "setAdmin", ...newAdmin }); setNewAdmin({ username: "", role: "tasks" }); }}>Add admin</button>
          </section>
          <section className="admin-card space-y-1">
            <h2 className="font-bold">Recent payments</h2>
            {data.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
            {data.payments.map((p) => (
              <div key={p.id as string} className="admin-row text-sm"><span className="flex-1 truncate">{p.product as string}</span><span className="font-semibold">{String(p.amount)} {p.method === "stars" ? "⭐" : "GRAM"}</span><span className={`text-xs ${p.status === "paid" ? "text-primary" : "text-muted-foreground"}`}>{p.status as string}</span></div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
