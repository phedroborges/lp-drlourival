import { getTags, createTag } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protegida(async () => Response.json(await getTags()));

export const POST = protegida(async (request) => {
  const body = await request.json();
  return Response.json(await createTag(body || {}), { status: 201 });
});
