import { getMunicipio } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const codigo = Number(new URL(request.url).searchParams.get("codigo"));
  if (!codigo) return Response.json({ error: "codigo é obrigatório" }, { status: 400 });
  const m = getMunicipio(codigo);
  if (!m) return Response.json({ error: "Município não encontrado" }, { status: 404 });
  return Response.json(m);
}
