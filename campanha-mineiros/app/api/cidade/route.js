import { getMunicipio } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protegida(async (request) => {
  const codigo = Number(new URL(request.url).searchParams.get("codigo"));
  if (!codigo) return Response.json({ error: "codigo é obrigatório" }, { status: 400 });
  const municipio = await getMunicipio(codigo);
  if (!municipio) return Response.json({ error: "Município não encontrado" }, { status: 404 });
  return Response.json(municipio);
});
