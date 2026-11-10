import { route } from "@/lib/api/handler";
import { exportData } from "@/lib/server/users";

export const dynamic = "force-dynamic";

export const GET = route({ limit: "sensitive" }, async ({ user }) => {
  const data = await exportData(user);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="manabi-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
