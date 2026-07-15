import { assignLider, unassignLider } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Puxa uma liderança já cadastrada para um bairro.
export async function POST(request) {
  const { lider_id, bairro_id } = await request.json();
  if (!lider_id || !bairro_id) {
    return Response.json({ error: "lider_id e bairro_id são obrigatórios" }, { status: 400 });
  }
  assignLider(lider_id, bairro_id);
  return Response.json({ ok: true });
}

// Remove o vínculo da liderança com o bairro.
export async function DELETE(request) {
  const { lider_id, bairro_id } = await request.json();
  if (!lider_id || !bairro_id) {
    return Response.json({ error: "lider_id e bairro_id são obrigatórios" }, { status: 400 });
  }
  unassignLider(lider_id, bairro_id);
  return Response.json({ ok: true });
}
