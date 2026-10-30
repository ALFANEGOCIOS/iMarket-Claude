"use client";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

// Comparte el enlace propio del anuncio (/anuncio/ID): menú nativo en móvil, o copia el enlace.
export default function ShareButton({ id, title, className = "" }) {
  async function share() {
    const url = `${window.location.origin}/anuncio/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        return;
      }
    } catch (failure) {
      if (failure?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado. Ya puedes pegarlo donde quieras.");
    } catch {
      window.prompt("Copia este enlace:", url);
    }
  }
  return (
    <Button type="button" variant="outline" className={className} onClick={share}>
      <Share2 size={16} />
      Compartir
    </Button>
  );
}
