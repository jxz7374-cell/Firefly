/*
 * 这个脚本的作用：
 * 1. 帮你快速创建一篇新的博客文章
 * 2. 自动补好最基础的 Front-matter（文章头部配置）
 * 3. 把文件放到 src/content/posts/ 目录里
 *
 * 用法示例：
 * pnpm new-post -- 我的第一篇文章
 */

import fs from "fs"
import path from "path"

function getDate() {
  // 生成今天的日期，格式类似：2026-07-23
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error(`Error: No filename argument provided
Usage: npm run new-post -- <filename>`)
  // 参数没传时，直接结束脚本，避免创建出错误文件
  process.exit(1)
}

let fileName = args[0]

// 如果你没有手动写 .md 或 .mdx，这里会自动补一个 .md
const fileExtensionRegex = /\.(md|mdx)$/i
if (!fileExtensionRegex.test(fileName)) {
  fileName += ".md"
}

// 所有文章默认都放在这个目录里
const targetDir = "./src/content/posts/"
const fullPath = path.join(targetDir, fileName)

if (fs.existsSync(fullPath)) {
  console.error(`Error: File ${fullPath} already exists `)
  process.exit(1)
}

// recursive: true 表示如果你写了多层目录，也会自动帮你创建好
// 例如：pnpm new-post -- 教程/入门篇
const dirPath = path.dirname(fullPath)
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
}

// 这里是新文章的默认模板
// 你以后最常改的就是 title、description、tags、category 这几个字段
const content = `---
title: ${args[0]}
published: ${getDate()}
description: ''
image: ''
tags: []
category: ''
draft: false 
lang: ''
---
`

fs.writeFileSync(path.join(targetDir, fileName), content)

console.log(`Post ${fullPath} created`)
