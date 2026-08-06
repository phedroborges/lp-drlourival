import { getDashboard } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protegida(async () => Response.json(await getDashboard()));
