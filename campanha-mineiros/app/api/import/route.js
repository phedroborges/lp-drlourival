import { importContatos } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const cities = Array.isArray(body) ? body : body?.data;
  if (!Array.isArray(cities)) return Response.json({ error: "formato inválido" }, { status: 400 });
  return Response.json(importContatos(cities));
}
