# 星火 · AI支教科普平台

纯静态H5站点，含20门科普课程、4类教学视频和互动猜数字游戏。无需后端或构建工具即可浏览。

## 本地预览

在此目录打开终端：

```powershell
node tools/preview.cjs
```

浏览器打开 http://127.0.0.1:4173/ 。预览服务支持视频字节范围请求及404状态。退出终端中的服务后，该预览地址将停止工作。

## 文件结构

- `index.html`：课程列表、筛选搜索、本机学习档案与学习留言。
- `course.html?id=7`：按课程id显示详情、分类教学视频和提问演示。
- `ai-series.html`：科普方向、学习建议与常见问题。
- `game.html`：猜数字互动游戏。
- `404.html`：静态主机404页面。
- `assets/courses.js`：共享课程数据。
- `assets/css/base.css`：全站颜色、字体、导航、表单组件、焦点和动态偏好。
- `assets/css/` 与 `assets/js/`：各页面专属样式和行为。

## 发布包

`dist/ai-science-site.zip` 是可解压上传的静态站点文件，排除了开发依赖、备份、验证截图和闲置Matter.js。当前用户尚未部署，正式分享域名待配置。

部署网址确定后，在此目录运行：

```powershell
python tools/package_site.py --base-url https://你的真实域名/站点子目录/
```

填写真实根网址；根目录部署时省略子目录。生成的分享图片链接、canonical和og:url会写成绝对URL。上传解压后的站点文件，并按静态主机要求映射404.html，再验证微信/QQ分享。

## 验证与交付记录

40项优化及本地验证结果见 [逐项交付记录](docs/frontend-completion.md)，原始清单见 [任务清单](docs/frontend-checklist.md)。浏览器与媒体证据保存在 `docs/verification/`。

```powershell
node tools/verify_frontend.cjs
node tools/verify_assets.cjs
```

这两项检查需要本地Chrome与Playwright；脚本支持用CHROME_PATH与PLAYWRIGHT_MODULE指定不同安装路径。媒体处理/验证使用Pillow和imageio-ffmpeg，位于本次工作目录的 `.tools/python/`。本机的完整Python运行时路径已记录于 `docs/tooling.md`。

本机学习档案不是账号认证，随堂助手为预设回复演示。真实手机弱网、Lighthouse和上线后分享平台抓取仍保留为待验收项目。

