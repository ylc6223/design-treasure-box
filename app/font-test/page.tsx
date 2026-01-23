'use client';

export default function FontTestPage() {
  return (
    <div className="min-h-screen bg-background p-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* 页面标题 */}
        <div className="space-y-4">
          <h1
            className="text-4xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            字体效果测试
          </h1>
          <p className="text-lg text-muted-foreground">Design Treasure Box - 字体配置展示</p>
        </div>

        {/* ZCOOL XiaoWei 字体展示 */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-6">
          <h2
            className="text-2xl font-semibold text-card-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ZCOOL XiaoWei（站酷小薇体）
          </h2>
          <p className="text-sm text-muted-foreground">适用于：标题、重点强调、特殊文字</p>
          <div
            className="space-y-2 text-card-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <p className="text-3xl">设计百宝箱</p>
            <p className="text-2xl">精选设计资源聚合入口</p>
            <p className="text-xl">为设计师和开发者提供高质量的设计美学参考</p>
          </div>
        </section>

        {/* Noto Sans SC 字体展示 */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Noto Sans SC（思源黑体）</h2>
          <p className="text-sm text-muted-foreground">适用于：正文、UI 界面、通用场景</p>
          <div className="space-y-2 text-card-foreground">
            <p className="text-3xl font-light">Light 300 - 设计百宝箱</p>
            <p className="text-3xl font-normal">Regular 400 - 设计百宝箱</p>
            <p className="text-3xl font-medium">Medium 500 - 设计百宝箱</p>
            <p className="text-3xl font-bold">Bold 700 - 设计百宝箱</p>
          </div>
        </section>

        {/* 实际应用示例 */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-6">
          <h2
            className="text-2xl text-card-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            实际应用示例
          </h2>
          <div className="space-y-3 text-card-foreground">
            <h3 className="text-xl font-medium">欢迎使用设计百宝箱</h3>
            <p className="text-base leading-relaxed">
              这是一个基于 Next.js 16
              构建的现代化设计资源聚合平台。我们精选了最优质的设计资源，为设计师和开发者提供一站式的参考工具。
            </p>
            <p className="text-base leading-relaxed">
              平台支持资源分类、深度搜索、专业评分系统以及个人收藏功能，让设计工作更加高效便捷。
            </p>
          </div>
        </section>

        {/* 字体栈说明 */}
        <section className="space-y-2 rounded-lg border border-border bg-muted p-4">
          <h3 className="text-sm font-semibold text-foreground">字体栈配置：</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>显示字体：ZCOOL XiaoWei → Noto Sans SC → SF Pro Display → system-ui</li>
            <li>正文字体：Noto Sans SC → SF Pro Text → system-ui</li>
            <li>等宽字体：SF Mono → monospace</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            注意：使用 CSS @import 方式加载字体，兼容 Turbopack
          </p>
        </section>
      </div>
    </div>
  );
}
