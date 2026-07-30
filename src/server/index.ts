import { Hono } from "hono";
import { healthRoute } from "./routes/health.ts";

// すべての API ルートを /api 配下にまとめる。
// アセット（SPA）に一致しないリクエストだけが Worker に届くため、
// /api 以外のパスはこのアプリでは扱わない
const app = new Hono().basePath("/api").route("/", healthRoute);

export default app;
