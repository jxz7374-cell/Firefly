# 尼克狐尼克博客

这是一个基于 `Astro` 和 `Firefly` 主题搭建的个人博客项目。

页面风格尽量保持和你给的参考站一致，但站点名字、头像、首页文案已经改成了 `尼克狐尼克`，同时保留了主题原本的排版和交互。

## 你最常用的 4 件事

### 1. 安装依赖

```bash
pnpm install
```

### 2. 本地启动

```bash
pnpm dev
```

启动后打开终端里显示的本地地址，一般是 `http://localhost:4321`。

### 3. 新建一篇文章

方式一：用命令自动生成模板

```bash
pnpm new-post -- 我的第一篇文章
```

运行后会自动在 `src/content/posts/` 里创建一个新的 Markdown 文件。

方式二：自己手动新建文件

你也可以直接在 `src/content/posts/` 里新建一个 `.md` 或 `.mdx` 文件。

### 4. 删除一篇文章

直接删除对应的文章文件即可。

例如：

```text
src/content/posts/我的第一篇文章.md
```

删除文件后，这篇文章就不会再出现在博客里。

## 文章放在哪里

所有博客文章都放在：

```text
src/content/posts/
```

你可以这样整理：

```text
src/content/posts/
├── 第一篇文章.md
├── 第二篇文章.md
└── 教程/
    ├── cover.png
    └── index.md
```

## 最重要的配置文件

- `src/config/siteConfig.ts`
  站点标题、网址、SEO、分页等总配置。

- `src/config/profileConfig.ts`
  头像、名字、个人简介、社交链接。

- `src/config/backgroundWallpaper.ts`
  首页大图、视频、横幅文案。

- `src/config/navBarConfig.ts`
  顶部导航栏内容。

- `scripts/new-post.js`
  自动创建文章模板的脚本，我已经补了比较详细的注释。

## 给小白的建议

- 改文案时，先改 `src/config` 里的配置，不要一上来改底层组件。
- 想发文章，就优先在 `src/content/posts/` 里操作文件。
- 改完后如果页面没变化，先看终端有没有报错。
- 不确定某个字段什么意思时，可以先复制现有文章改一份再试。

## 现在已经帮你改好的地方

- 站点名从 `Firefly` 改成了 `尼克狐尼克`
- 首页标题和个人资料文案已调整
- 增加了本地 `SVG` Logo 和头像
- 文章管理继续保持“新增/删除文件即可”的方式
- 关键脚本和配置补充了更容易理解的注释
- 默认免费网址已改成 `https://jxz7374-cell.github.io/Firefly/`
