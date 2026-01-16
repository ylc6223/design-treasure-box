import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Providers } from '@/components/providers'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { getCurrentUser } from '@/lib/supabase/auth'
import categories from '@/data/categories.json'
import './globals.css'

export const metadata: Metadata = {
  title: '设计百宝箱 - Design Treasure Box',
  description: '精选设计资源聚合入口，为设计师和开发者提供高质量的设计美学参考',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LayoutWrapper categories={categories} profile={user?.profile ?? null}>
              {children}
            </LayoutWrapper>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
