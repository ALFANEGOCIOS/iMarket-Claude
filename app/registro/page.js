"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault(); setError(""); setNotice("");
    if (name.trim().length < 2) return setError("Escribe tu nombre completo.");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    if (!terms) return setError("Debes aceptar las condiciones de uso.");
    const client = getSupabase();
    if (!client) return setError("Supabase no está configurado en esta instalación.");
    setBusy(true);
    try {
      const { data, error: authError } = await client.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim(), display_name: name.trim() }, emailRedirectTo: window.location.origin } });
      if (authError) throw authError;
      if (data.session && data.user) {
        router.replace("/");
        return;
      }
      setNotice("Cuenta creada. Revisa tu correo para confirmar la dirección y después entra desde Iniciar sesión.");
      setBusy(false);
    } catch (failure) {
      setError(String(failure?.message || "No pudimos crear tu cuenta."));
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-background auth-background-one" /><div className="auth-background auth-background-two" />
      <div className="auth-shell">
        <Link href="/" className="auth-back"><ArrowLeft size={16} /> Volver al marketplace</Link>
        <Card className="auth-card auth-register-card">
          <CardHeader className="auth-card-header">
            <Link href="/" className="auth-brand"><img src="/brand/logo-icon.png" alt="" width="30" height="30" className="auth-brand-logo" />iMarket</Link>
            <div className="auth-icon"><UserRound size={22} /></div>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Únete a una comunidad de propietarios de iPhone en La Habana.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="auth-page-form" onSubmit={submit}>
              <div className="ui-field"><Label htmlFor="name">Nombre completo</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Tu nombre" required /></div>
              <div className="ui-field"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tu@correo.com" required /></div>
              <div className="ui-field"><Label htmlFor="password">Contraseña</Label><div className="password-wrap"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Mínimo 8 caracteres" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
              <div className="ui-field"><Label htmlFor="confirm">Confirmar contraseña</Label><Input id="confirm" type={showPassword ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Repite tu contraseña" required /></div>
              <label className="auth-checkbox"><Checkbox checked={terms} onCheckedChange={(v) => setTerms(Boolean(v))} /> <span>Acepto las <Link href="/terminos" target="_blank">condiciones de uso</Link> y confirmo que soy mayor de edad.</span></label>
              {error && <div className="auth-alert error" role="alert">{error}</div>}
              {notice && <div className="auth-alert success" role="status">{notice}</div>}
              <Button type="submit" disabled={busy} className="auth-submit">{busy ? "Creando cuenta…" : "Crear cuenta"}<ArrowRight size={17} /></Button>
            </form>
          </CardContent>
          <CardFooter className="auth-card-footer"><span>¿Ya tienes una cuenta?</span><Link href="/login">Iniciar sesión</Link></CardFooter>
          <div className="auth-security"><ShieldCheck size={15} /> Tu identidad y documentos solo se solicitan cuando necesites verificación para vender.</div>
        </Card>
      </div>
    </main>
  );
}
