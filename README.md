# 学生成绩管理系统

这是一个适合课程作业展示的学生成绩管理系统，采用“网页界面 + C 语言核心”架构：

- 前端网页负责录入、查询、修改、删除和统计展示
- `C` 语言程序负责学生数据处理、成绩计算和 `students.txt` 文件读写
- `Node.js` 作为网页服务层，把浏览器请求转发给 C 核心

## 功能列表

- 添加学生：学号、姓名、高数、英语、C 语言成绩
- 删除指定学号的学生记录
- 查询学生：按学号精确查询、按姓名模糊查询
- 修改基本信息或单科成绩
- 启动时从 `students.txt` 加载数据
- 更新后自动保存到 `students.txt`
- 统计各科平均分、最高分、最低分
- 计算每位学生总分和平均 GPA
- 统计成绩区间人数分布
- 生成班级成绩排名表
- 统计不及格学生名单及不及格科目
- 计算各科及格率与优秀率（`>= 90`）

## 项目结构

```text
student/
├─ bin/
├─ c_core/
│  └─ student_system.c
├─ deploy/
│  └─ nginx.student-system.conf
├─ docs/
│  ├─ 课程设计报告.md
│  └─ 部署方案.md
├─ public/
│  ├─ app.js
│  ├─ index.html
│  └─ style.css
├─ students.txt
├─ package.json
├─ README.md
└─ server.js
```

## 本地运行

确保本机已安装：

- `gcc`
- `node`

在项目目录执行：

```powershell
cd C:\Users\Thinkbook\Desktop\student
node server.js
```

启动后访问：

```text
http://localhost:3000
```

注意：关闭浏览器不会关闭网站服务，但关闭运行 `node server.js` 的终端后，网站服务就停止了。  
也就是说，只要 `Node.js` 服务还在运行，你重新打开浏览器仍然可以访问；如果你把终端关了，就需要重新执行 `node server.js`。

## 免费公网部署推荐

现在项目已经提供了一个“纯静态版本”前端，适合部署到 GitHub Pages。

- 静态页面入口：`public/index.html`
- GitHub Pages 根入口：`index.html`
- 数据保存方式：浏览器 `localStorage`

这意味着：

- 不需要持续运行 Node.js 服务器
- 不会消耗 Railway 这类后端平台额度
- 只要 GitHub Pages 在线，网址就能长期打开

## 访问范围说明

当前程序已经监听 `0.0.0.0`，这意味着：

- 你自己访问：用 `http://localhost:3000`
- 同一局域网别人访问：用 `http://你的局域网IP:3000`
- 所有人通过互联网访问：需要部署到有公网 IP 的服务器，或配置端口映射 / 内网穿透

## 部署与报告材料

- 部署说明见 [docs/部署方案.md](C:/Users/Thinkbook/Desktop/student/docs/部署方案.md)
- 课程设计报告见 [docs/课程设计报告.md](C:/Users/Thinkbook/Desktop/student/docs/课程设计报告.md)
- Nginx 配置示例见 [deploy/nginx.student-system.conf](C:/Users/Thinkbook/Desktop/student/deploy/nginx.student-system.conf)
- Docker 部署文件见 [Dockerfile](C:/Users/Thinkbook/Desktop/student/Dockerfile)

## GitHub Pages 部署方法

如果你想零成本长期公开访问，建议使用 GitHub Pages。

1. 把当前修改推送到 GitHub
2. 打开 GitHub 仓库页面
3. 进入 `Settings -> Pages`
4. 在 `Build and deployment` 里选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. 保存后等待几分钟
6. GitHub 会生成一个 `https://你的用户名.github.io/仓库名/` 的网址

注意：

- 静态版的数据保存在每个访问者自己的浏览器中
- 不同设备之间不会自动同步
- 这个版本适合课程展示、作业提交和长期免费访问

## C 核心说明

网页并不直接处理成绩，而是调用 `c_core/student_system.c` 编译出的程序。核心程序负责：

- 读取 `students.txt`
- 执行增删改查
- 计算总分、GPA、排名和统计结果
- 将结果以 JSON 形式返回给网页

这部分能很好体现 C 语言课程作业要求。
