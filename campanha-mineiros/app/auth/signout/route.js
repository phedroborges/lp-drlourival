import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST para nao dar logout por prefetch de link.
export async function POST(request) {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
