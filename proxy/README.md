# 中转站部署说明

给散步 App 用的。目的是：**朋友打开网页就能用，不用填任何 key。**

全程在浏览器里点，不用装任何软件，不用命令行。大概 15 分钟。

---

## 先说清楚这东西在干嘛

散步 App 是个静态网页，**没有服务器**。任何写进网页代码里的 key，
浏览器都必须下载下来才能用 —— 也就是任何人打开开发者工具都看得见。
仓库还是 Public 的，GitHub 上有机器人 24 小时扫 key。

中转站就是在中间加一个小程序：

```
朋友的手机  →  中转站（key 藏在这里）  →  DeepSeek
```

key 只存在 Cloudflare 的服务器上，手机拿不到，仓库里也没有。
这个中转站不存任何数据、不记日志，转发完就忘。

---

## 第一步：注册 Cloudflare

打开 https://dash.cloudflare.com/sign-up ，用邮箱注册。免费。

注册完会让你验证邮箱，验证一下。

（如果它问你要不要添加网站/域名，**跳过**，我们不需要。）

---

## 第二步：新建一个 Worker

1. 登录后，左边菜单找 **Compute (Workers)** → **Workers & Pages**
2. 点 **Create** → 选 **Start with Hello World!** → **Get started**
3. 给它起个名字，比如 `walk-ai`
   > 这个名字会出现在最终网址里，随便起，但别带你的名字或者敏感词
4. 点 **Deploy**

部署完会给你一个网址，长这样：

```
https://walk-ai.你的用户名.workers.dev
```

**把这个网址记下来**，最后要给我。

---

## 第三步：把代码换成我们的

1. 部署成功的页面上点 **Edit code**（或者 **</> Edit Code**）
2. 左边会出现一个代码编辑器，里面是它自带的示例代码
3. **全选删掉**（点进编辑器，Command + A，然后 Delete）
4. 打开仓库里的 [`proxy/worker.js`](./worker.js)，**全文复制**，粘贴进去
5. 点右上角 **Deploy**

---

## 第四步：把 DeepSeek 的 key 存进去

这一步是关键：key 要存成 **Secret**，存了之后连你自己都看不到，只有程序能用。

1. 回到这个 Worker 的页面，点 **Settings**
2. 找 **Variables and Secrets**（或 **Variables**）
3. 点 **Add**
4. Type 选 **Secret**（**别选 Text**，Text 是明文的）
5. Variable name 填：`DEEPSEEK_KEY`
   > 一个字都不能差，大小写也是。程序就认这个名字。
6. Value 粘贴你那串 `sk-...`
7. 点 **Deploy** / **Save and deploy**

---

## 第五步：告诉我网址

把第二步那个 `https://walk-ai.xxx.workers.dev` 发给我
（**只发网址，别发 key**），我填进 App 里推上去，就通了。

---

## 之后怎么管

**看花了多少钱**：DeepSeek 后台 https://platform.deepseek.com 能看用量。
建议只充一小笔钱当上限 —— 这是万一网址被人扒去乱用时最实在的兜底。

**换 key**：回第四步，把 Secret 的值改掉，Deploy。App 那边不用动。

**关掉**：Worker 页面 → Settings → 最下面 Delete。删了 App 就回到「要自己填 key」的状态，不会崩。

**免费额度**：每天 10 万次请求。一趟散步 4 次调用，够两万五千趟。

---

## 代码里有什么

`worker.js` 大约 60 行，做的事：

| 做什么 | 为什么 |
|---|---|
| 只放行来自 `klu991230.github.io` 的请求 | 别人把网址扒去自己用会被挡掉 |
| 模型写死成 `deepseek-v4-flash-vision-exp` | 别让人拿这个地址去跑别的活 |
| `max_tokens` 封顶 4096 | 同上，防止有人让它生成一篇长文 |
| 关掉思考模式 | 不关的话它会把字数用光，正文是空的（踩过这个坑） |
| 请求体限制 8MB | 一张照片约 250KB，够用 |
| key 只出现在发给 DeepSeek 的那一行 | 不进响应头、不进响应体，浏览器永远拿不到 |

来源检查挡得住浏览器里的滥用，**挡不住铁了心用命令行的人**。
真正的兜底是 DeepSeek 后台的余额上限。给一两个朋友试用，这个程度够了。
