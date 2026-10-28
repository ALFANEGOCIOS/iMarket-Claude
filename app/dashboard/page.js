"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";
import { createRepository, publicError } from "../../lib/database.mjs";
import { isCurrentUserAdmin, ensureProfile } from "../../lib/auth";
import { AdminPanel } from "../../components/live-panels";

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState({ loading: true, admin: false, user: null, repository: null, error: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;
    const client = getSupabase();
    if (!client) { setState({ loading: false, admin: false, user: null, repository: null, error: "Supabase no está configurado." }); return; }
    client.auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      if (!data.session?.user) { router.replace("/login"); return; }
      const admin = await isCurrentUserAdmin(client);
      if (!admin) { router.replace("/"); return; }
      const profile = await ensureProfile(client, data.session.user);
      if (active) setState({ loading: false, admin: true, user: profile, repository: createRepository(client), error: "" });
    }).catch((failure) => { if (active) setState({ loading: false, admin: false, user: null, repository: null, error: publicError(failure) }); });
    return () => { active = false; };
  }, [router]);

  async function logout() {
    const client = getSupabase();
    await client?.auth.signOut();
    router.replace("/login");
  }

  if (state.loading) return <main className="dashboard-loading"><div className="loading-dot" /><span>Comprobando permisos de administrador…</span></main>;
  if (state.error) return <main className="dashboard-loading"><div className="dashboard-error">{state.error}<Link href="/">Volver al inicio</Link></div></main>;
  if (!state.admin || !state.repository) return null;

  return (
    <main className="admin-page">
      <AdminPanel repository={state.repository} notify={setToast} user={state.user} onLogout={logout} />
      {toast && <div className="toast toast-visible"><span>{toast}</span><button onClick={() => setToast("")}>×</button></div>}
    </main>
  );
}
