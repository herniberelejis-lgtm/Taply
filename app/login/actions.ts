"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/db";

export async function accionLogin(fd: FormData): Promise<void> {
  const password = process.env.ADMIN_PASSWORD;
  const intento = String(fd.get("password") ?? "");

  if (!password || intento !== password) {
    redirect("/login?error=1");
  }

  const jar = await cookies();
  jar.set("admin_session", hashPassword(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: "/",
  });
  // Login por contraseña compartida: sin identidad de quién es, queda
  // igual registrado en la auditoría (como "equipo (sin identificar)").
  await registrarAuditoria(null, "login", "Inicio de sesión con contraseña compartida");
  redirect("/admin");
}

export async function accionLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete("admin_session");
  jar.delete("admin_google_session");
  redirect("/login");
}
