import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Providers } from '@/components/providers';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Toaster } from '@/components/ui/sonner';
import { getCurrentUser } from '@/lib/supabase/auth';
import './globals.css';

export const metadata: Metadata = {
  title: '设计百宝箱 - Design Treasure Box',
  description: '精选设计资源聚合入口，为设计师和开发者提供高质量的设计美学参考',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 注入全局配置防线，防止部分代码分片丢失环境变量 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.__SUPABASE_CONFIG__ = {
  url: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
  key: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}"
};
`,
          }}
        />
      </head>
      <body>
        <Providers initialProfile={user?.profile ?? null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LayoutWrapper profile={user?.profile ?? null}>{children}</LayoutWrapper>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
