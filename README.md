# 散步 App

一个把散步变成拍照任务的小游戏。开局给三个任务，用手机实时取景拍照，AI 用「有点损的朋友」的语气点评，走完生成一张卡片。

**在线试玩** → https://klu991230.github.io/WalkingApp/

需要在页面里填自己的 Anthropic API key 才会有 AI 点评，不填也能走完流程。

---

## 这个仓库里有什么

| 文件 | 是什么 |
| --- | --- |
| `index.html` | 整个 App。HTML + CSS + 原生 JS 全在这一个文件里，没有框架、没有构建步骤、没有依赖 |
| `CLAUDE.md` | 项目上下文和设计原则。给 Claude Code 看的，也是我自己的产品笔记 |
| `.gitignore` | 告诉 git 哪些文件不要管 |

## 怎么跑

**线上**：GitHub Pages 自动部署 `main` 分支根目录，push 之后一两分钟自动更新。

**本地**：直接双击 `index.html` 打不开摄像头 —— 浏览器的 `getUserMedia` 只在 HTTPS 或 localhost 下才允许。所以要起个本地服务：

```bash
python3 -m http.server 8000
```

然后浏览器打开 `http://localhost:8000`。

注意用局域网 IP（`192.168.x.x`）访问会被浏览器拒绝摄像头权限。要在手机上真机测试，直接访问上面的线上地址。

## 关于 API key

**仓库是 public 的，key 绝对不能进代码。**

key 由用户自己填在页面输入框里，存在浏览器的 localStorage，只在这台设备上。代码里的 `HARDCODED_KEY` 常量必须永远保持空字符串。

不要创建 `.env`、`config.js` 或任何存放 key 的文件并提交。
