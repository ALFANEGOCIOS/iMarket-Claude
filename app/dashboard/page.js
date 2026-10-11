"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
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
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link href="/" className="auth-brand"><img src="/brand/logo-icon.png" alt="" width="30" height="30" className="auth-brand-logo" />iMarket</Link>
          <div className="admin-title"><ShieldCheck size={17} /><span>Centro de administración</span></div>
          <div className="admin-user"><span>{state.user?.display_name || "Administrador"}</span><button onClick={logout}><LogOut size={15} /> Salir</button></div>
        </div>
      </header>
      <section className="admin-content">
        <div className="admin-page-heading"><div><span className="admin-eyebrow">Control interno</span><h1>Dashboard</h1><p>Supervisa iMarket, revisa solicitudes y gestiona la comunidad.</p></div><Link href="/" className="admin-back-link"><ArrowLeft size={15} /> Ver marketplace</Link></div>
        <AdminPanel repository={state.repository} notify={setToast} />
      </section>
      {toast && <div className="toast toast-visible"><span>{toast}</span><button onClick={() => setToast("")}>×</button></div>}
    </main>
  );
}
