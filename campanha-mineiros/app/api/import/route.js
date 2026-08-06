import { importContatos } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = protegida(async (request) => {
  const body = await request.json();
  const cidades = Array.isArray(body) ? body : body?.data;
  if (!Array.isArray(cidades)) return Response.json({ error: "formato inválido" }, { status: 400 });
  return Response.json(await importContatos(cidades));
});
