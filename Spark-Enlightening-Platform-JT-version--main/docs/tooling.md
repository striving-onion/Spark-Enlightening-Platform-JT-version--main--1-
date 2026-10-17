# 本次本地工具

本次使用的Python（已包含可正常运行的Pillow）：

```powershell
& 'C:\Users\22279\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools/verify_media.py
```

项目中的 `.tools/python/` 为本次安装的imageio-ffmpeg与BeautifulSoup依赖。视频/图片处理脚本默认从这里导入；Pillow来自上述完整运行时。

`tools/optimize_media.py` 支持从站点外原始资源备份重建WebP与poster，默认跳过已经转码的视频；`--reencode`明确重新编码所有视频。正式数据在 `assets/`，不依赖Python即可运行。

`tools/verify_frontend.cjs` 与 `tools/verify_assets.cjs` 默认读取本机Codex运行时的Playwright模块与Chrome，可通过 `PLAYWRIGHT_MODULE` / `CHROME_PATH`覆盖。

一次性HTML迁移脚本留在 `.tools/migrations/` 供追溯，不是常规构建步骤，不应重新执行覆盖后续修改。

本次尝试从npm官方源及镜像安装Lighthouse与axe审计工具，两次均以ECONNRESET失败。没有生成或宣称Lighthouse/axe分数；布局偏移采用浏览器PerformanceObserver测量，对比度使用WCAG相对亮度公式计算。证据与测试范围见逐项交付记录。
