import { exportAll } from "@/lib/db";
import { protegida } from "@/lib/rota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = protegida(async () => {
  const data = JSON.stringify(await exportAll(), null, 2);
  return new Response(data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="campanha-drlourival-backup.json"',
    },
  });
});
