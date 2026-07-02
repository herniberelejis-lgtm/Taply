"use client";

import { useState } from "react";

export default function CopyButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // navegadores sin permiso de portapapeles: no rompemos la página
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-400"
    >
      {copiado ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
