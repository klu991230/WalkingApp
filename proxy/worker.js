/* =========================================================
   散步 App 的中转站
   跑在 Cloudflare Workers 上。它只做一件事：

     手机 → 这里（把 key 加进去）→ DeepSeek

   为什么需要它：
   散步 App 是一个静态网页，没有服务器。任何写进网页代码里的 key，
   浏览器都必须下载下来才能用——也就是任何人都看得见。
   有了这个中转站，key 只存在 Cloudflare 的 Secret 里，
   手机上永远拿不到，仓库里也没有。

   这里不存任何数据，不记日志，转发完就忘。
   ========================================================= */

/* 只接受从这些地址来的请求。别人把这个网址扒去自己用会被挡掉。
   （挡不住铁了心用命令行的人，真正的兜底是 DeepSeek 后台的余额上限。） */
const ALLOW = [
  "https://klu991230.github.io",
  "http://localhost:8765",          // 本地调试用
];

const UPSTREAM   = "https://api.deepseek.com/anthropic/v1/messages";
const MODEL      = "deepseek-v4-flash-vision-exp";   // 只有这个读得了图
const MAX_BODY   = 8 * 1024 * 1024;   // 一张 1000px 照片约 250KB，8MB 绰绰有余
const MAX_TOKENS = 4096;

const cors = origin => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});

const say = (obj, status, origin) => new Response(JSON.stringify(obj), {
  status, headers: { "Content-Type": "application/json", ...cors(origin) },
});

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = ALLOW.includes(origin);

    /* 浏览器正式发请求前会先来问一句「我能发吗」 */
    if (req.method === "OPTIONS")
      return new Response(null, {
        status: allowed ? 204 : 403,
        headers: allowed ? cors(origin) : {},
      });

    if (!allowed)              return new Response("not allowed", { status: 403 });
    if (req.method !== "POST") return new Response("POST only",   { status: 405 });

    if (!env.DEEPSEEK_KEY)
      return say({ error: { message: "中转站还没配 key（Settings → Variables → DEEPSEEK_KEY）" } }, 500, origin);

    const raw = await req.text();
    if (raw.length > MAX_BODY)
      return say({ error: { message: "请求太大了" } }, 413, origin);

    let body;
    try { body = JSON.parse(raw); }
    catch { return say({ error: { message: "请求格式不对" } }, 400, origin); }

    /* 别让人拿这个地址去跑别的活：模型写死、长度封顶、关掉思考模式
       （思考模式会把 max_tokens 吃光，返回里只剩思考块、正文是空的） */
    body.model      = MODEL;
    body.max_tokens = Math.min(Number(body.max_tokens) || 2048, MAX_TOKENS);
    body.thinking   = { type: "disabled" };
    delete body.stream;

    const r = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.DEEPSEEK_KEY,      // key 只在这一行出现，只在服务器上
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    return new Response(r.body, {
      status: r.status,
      headers: { "Content-Type": "application/json", ...cors(origin) },
    });
  },
};
