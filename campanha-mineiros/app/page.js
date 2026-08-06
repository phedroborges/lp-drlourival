import { getEstado } from "@/lib/db";
import EstadoView from "./EstadoView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  return <EstadoView municipios={await getEstado()} />;
}
