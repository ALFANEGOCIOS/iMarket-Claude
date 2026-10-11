"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";
import { ensureProfile, isCurrentUserAdmin } from "../../lib/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    // Cuando la persona vuelve del enlace de "olvidé mi contraseña", Supabase
    // establece una sesión temporal y dispara este evento. Si no lo
    // capturamos aquí, el efecto de abajo la mandaría directo al
    // marketplace sin dejarla cambiar la contraseña.
    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    const client = getSupabase();
    if (!client || recovery) return;
    client.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
      if (await isCurrentUserAdmin(client)) router.replace("/dashboard");
      else router.replace("/");
    });
    return () => { active = false; };
  }, [router, recovery]);

  async function submitNewPassword(event) {
    event.preventDefault();
    setError(""); setNotice("");
    if (newPassword.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (newPassword !== newPasswordAgain) { setError("Las contraseñas no coinciden."); return; }
    setBusy(true);
    const client = getSupabase();
    try {
      const { error: updateError } = await client.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setNotice("Tu contraseña se actualizó. Ya puedes seguir usando iMarket.");
      setRecovery(false);
      setTimeout(() => router.replace("/"), 1200);
    } catch (failure) {
      setError(failure?.message || "No pudimos actualizar tu contraseña.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const client = getSupabase();
    if (!client) { setError("Supabase no está configurado en esta instalación."); setBusy(false); return; }
    try {
      const { data, error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      if (!data.user) throw new Error("No se pudo iniciar la sesión.");
      await ensureProfile(client, data.user);
      const admin = await isCurrentUserAdmin(client);
      router.replace(admin ? "/dashboard" : "/");
    } catch (failure) {
      const message = String(failure?.message || "");
      setError(message.includes("Invalid login credentials") ? "El correo o la contraseña no son correctos." : message || "No pudimos iniciar sesión.");
      setBusy(false);
    }
  }

  async function forgotPassword() {
    setError(""); setNotice("");
    if (!email.trim()) { setError("Escribe primero tu correo electrónico."); return; }
    const client = getSupabase();
    if (!client) { setError("Supabase no está configurado."); return; }
    const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login` });
    if (resetError) setError(resetError.message);
    else setNotice("Te enviamos las instrucciones para restablecer tu contraseña.");
  }

  return (
    <main className="auth-page">
      <div className="auth-background auth-background-one" />
      <div className="auth-background auth-background-two" />
      <div className="auth-shell">
        <Link href="/" className="auth-back"><ArrowLeft size={16} /> Volver al marketplace</Link>
        <Card className="auth-card">
          {recovery ? (
            <>
              <CardHeader className="auth-card-header">
                <Link href="/" className="auth-brand"><img src="/brand/logo-icon.png" alt="" width="30" height="30" className="auth-brand-logo" />iMarket</Link>
                <div className="auth-icon"><LockKeyhole size={22} /></div>
                <CardTitle>Elige tu nueva contraseña</CardTitle>
                <CardDescription>Escribe una contraseña nueva para tu cuenta.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="auth-page-form" onSubmit={submitNewPassword}>
                  <div className="ui-field"><Label htmlFor="newPassword">Nueva contraseña</Label><Input id="newPassword" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••" required /></div>
                  <div className="ui-field"><Label htmlFor="newPasswordAgain">Repite la contraseña</Label><Input id="newPasswordAgain" type={showPassword ? "text" : "password"} value={newPasswordAgain} onChange={(e) => setNewPasswordAgain(e.target.value)} autoComplete="new-password" placeholder="••••••••" required /></div>
                  {error && <div className="auth-alert error" role="alert">{error}</div>}
                  {notice && <div className="auth-alert success" role="status">{notice}</div>}
                  <Button type="submit" disabled={busy} className="auth-submit">{busy ? "Guardando…" : "Guardar nueva contraseña"}<ArrowRight size={17} /></Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="auth-card-header">
                <Link href="/" className="auth-brand"><img src="/brand/logo-icon.png" alt="" width="30" height="30" className="auth-brand-logo" />iMarket</Link>
                <div className="auth-icon"><LockKeyhole size={22} /></div>
                <CardTitle>Inicia sesión</CardTitle>
                <CardDescription>Accede a tus favoritos, publicaciones y conversaciones.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="auth-page-form" onSubmit={submit}>
                  <div className="ui-field"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tu@correo.com" required /></div>
                  <div className="ui-field"><div className="field-label-row"><Label htmlFor="password">Contraseña</Label><button type="button" className="auth-link-button" onClick={forgotPassword}>¿Olvidaste tu contraseña?</button></div><div className="password-wrap"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
                  {error && <div className="auth-alert error" role="alert">{error}</div>}
                  {notice && <div className="auth-alert success" role="status">{notice}</div>}
                  <Button type="submit" disabled={busy} className="auth-submit">{busy ? "Entrando…" : "Iniciar sesión"}<ArrowRight size={17} /></Button>
                </form>
              </CardContent>
              <CardFooter className="auth-card-footer"><span>¿Todavía no tienes cuenta?</span><Link href="/registro">Crear una cuenta</Link></CardFooter>
            </>
          )}
          <div className="auth-security"><ShieldCheck size={15} /> Tus datos se protegen mediante Supabase Auth y las políticas de seguridad de iMarket.</div>
        </Card>
      </div>
    </main>
  );
}
