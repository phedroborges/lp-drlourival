import { exportAll } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = JSON.stringify(exportAll(), null, 2);
  return new Response(data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="campanha-mineiros-backup.json"',
    },
  });
}
