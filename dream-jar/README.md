# 梦想储蓄罐 Dream Jar

一个「把梦想装进罐子里」的数字储蓄网页：创建梦想、上传梦想照片、设置目标金额，每存一笔钱，玻璃罐里的水位就会升高、磨砂玻璃会变得更透明，罐子上的梦想图片也会一点点变清晰。存满之后上传实现梦想时的真实照片，生成属于你的梦想纪念档案。

纯静态网站，**不需要服务器、不需要数据库、不需要安装任何依赖**，直接放到 GitHub Pages 就能用。

---

## 一、部署到 GitHub（3 分钟）

### 方式 A：网页上传（最简单，不用命令行）

1. 登录 GitHub，点右上角 **+ → New repository**，仓库名例如 `dream-jar`，选择 **Public**，创建。
2. 进入新仓库，点 **Add file → Upload files**。
3. 把本文件夹里的**全部内容**（`index.html`、`css/`、`js/`、`assets/`、`manifest.webmanifest`、`sw.js`、`.nojekyll`、`README.md`）拖进上传框，点 **Commit changes**。
   - 注意：要上传文件夹里面的文件，而不是外层的 `dream-jar` 文件夹本身；`index.html` 必须直接位于仓库根目录。
4. 进入仓库 **Settings → Pages**：
   - **Source** 选择 `Deploy from a branch`
   - **Branch** 选择 `main`，目录选择 `/ (root)`，点 **Save**
5. 等 1–2 分钟，刷新 Pages 页面，会看到网址：`https://你的用户名.github.io/dream-jar/`，打开即可使用。

### 方式 B：命令行（Git 已安装）

```bash
cd dream-jar
git init
git add .
git commit -m "feat: 梦想储蓄罐首个版本"
git branch -M main
git remote add origin https://github.com/你的用户名/dream-jar.git
git push -u origin main
```

推送后在仓库 **Settings → Pages** 里按上面第 4 步开启一次即可。以后每次改完文件执行 `git add . && git commit -m "update" && git push`，网页会自动更新（约 1 分钟后生效）。

> 小贴士：想更新网页但浏览器还显示旧版本时，按 `Ctrl + F5`（Mac 用 `Cmd + Shift + R`）强制刷新即可。

### 本地预览

请用本地服务器打开（**直接双击 `index.html` 时，Chrome / Edge 会因为文件安全策略拒绝加载 ES 模块，页面会是空白**，这是浏览器限制，不是网页故障）：

```bash
cd dream-jar
python -m http.server 8080
# 然后浏览器打开 http://localhost:8080
```

如果电脑上装了 Node，也可以用 `npx serve` 或 VS Code 的 Live Server 插件。

---

## 二、已实现的功能

按《梦想储蓄罐网页功能需求说明书（PRD）》与页面原型图说明实现：

| 模块 | 实现情况 |
| --- | --- |
| 首页 Dashboard | 当期梦想的大型玻璃罐 + 目标/已存/还需金额 + 进度 + 快速存钱 |
| 从模糊到清晰 | 0% / 33% / 66% / 100% 四个阶段的罐子对比展示 |
| 创建梦想 | 梦想名称、梦想图片、目标金额、梦想描述、完成纪念文字（另含开始时间、存钱方式、存钱笔记） |
| 储蓄记录 | 存入金额、日期、备注；自动计算累计金额与完成比例，支持删除记录 |
| 储蓄罐视觉系统 | 完成度驱动模糊度、磨砂度、水位、透明度、饱和度与光效，五个状态阈值与 PRD 一致 |
| 梦想详情页 | 大型罐子（可用鼠标/手指滑动换角度查看）+ 梦想数据 + 存钱记录 + 储蓄时间线 + 梦想的样子 |
| 梦想完成 | 上传实现照片、完成日期、最终金额、留言，触发庆祝动画 |
| 梦想收藏馆 | 照片墙式展示所有已完成的梦想，点击查看完整纪念档案 |
| 数据保存 | 浏览器 LocalStorage（含图片压缩），支持导出 / 导入 JSON 备份 |
| 其他 | 夜间模式、移动端底部导航、离线缓存（PWA）、示例数据一键载入 |

第一版**没有**实现（与 PRD 的「暂不实现功能」一致）：账号登录、支付接口、真实银行连接、多人共享。

---

## 三、目录结构

```
dream-jar/
├── index.html                 # 入口页面
├── manifest.webmanifest       # PWA 配置（可添加到手机主屏幕）
├── sw.js                      # 离线缓存
├── .nojekyll                  # 告诉 GitHub Pages 不要用 Jekyll 处理
├── css/
│   └── style.css              # 全部样式：玻璃拟态、储蓄罐视觉系统、响应式
├── js/
│   ├── app.js                 # 入口：路由、全局事件、主题
│   ├── store.js               # 数据层：LocalStorage 读写、进度与视觉参数计算
│   ├── jar.js                 # 玻璃储蓄罐组件（含旋转交互）
│   ├── components.js          # 通用片段：卡片、记录、时间线、图标
│   ├── dialogs.js             # 弹窗：创建 / 编辑 / 存钱 / 完成梦想
│   ├── ui.js                  # Toast、弹窗容器、确认框、庆祝动画
│   ├── utils.js               # 工具函数（金额日期格式化、图片压缩）
│   └── views/
│       ├── home.js            # 首页
│       ├── dreams.js          # 我的梦想
│       ├── detail.js          # 梦想详情
│       ├── completed.js       # 已完成 / 梦想收藏馆 / 梦想档案
│       └── settings.js        # 设置
└── assets/
    ├── icon.svg               # 站点图标
    └── samples/               # 示例梦想的插画（可删除）
```

---

## 四、数据说明

- 所有数据保存在你浏览器的 **LocalStorage** 中，键名 `dreamjar.v1`。换浏览器、换设备、清理浏览器数据都会看不到原来的记录，建议定期到「设置 → 导出备份」保存 JSON 文件。
- 上传的图片会先在浏览器里压缩（最长边 1200px、JPEG 质量 0.8）再保存，避免占用过多空间。浏览器本地存储通常只有约 5MB，如果提示保存失败，请先导出备份并减少图片数量。
- 数据结构对应 PRD 中的三张表：
  - `dreams[]` ↔ Dream：`id / name / image / target / description / completeMessage / startDate / targetDate / savingMethod / savingNote / createTime / status`
  - `dreams[].deposits[]` ↔ Deposit：`id / amount / date / note / createTime`
  - `dreams[].archive` ↔ Archive：`id / finishImage / finishDate / finalAmount / memoryText`

想升级成「云端同步、多设备使用」时，只需把 `js/store.js` 的读写换成 Supabase 或 Firebase 的接口，页面代码基本不用改。

---

## 五、视觉与文案可自定义的地方

- 主色、圆角、阴影：`css/style.css` 顶部的 `:root` 变量（`--primary`、`--accent` 等）。
- 储蓄罐的模糊 / 水位 / 透明度曲线：`js/store.js` 里的 `jarVisual()`。
- 示例梦想：`js/store.js` 里的 `sampleDreams()`；不想要示例数据可在「设置 → 清空所有数据」，或把 `js/app.js` 中首次载入示例的那几行删掉。
- 首页文案：`js/views/home.js`。

---

## 六、兼容性

在 Chrome、Edge、Safari、Firefox 的近几年版本上均可正常使用；支持手机端（底部导航栏 + 触摸滑动查看罐子）。玻璃拟态使用 `backdrop-filter`，极老的浏览器会降级成半透明卡片，功能不受影响。

祝你的每一个梦想，都能被装进罐子里，然后一点点变成现实。
