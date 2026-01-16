'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResourceForm } from '@/components/admin/resource-form'
import { toast } from 'sonner'
import type { CreateResourceRequest } from '@/types/resource'

export default function NewResourcePage() {
  const router = useRouter()

  const handleSubmit = async (data: CreateResourceRequest) => {
    try {
      const response = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create resource')
      }

      toast({
        title: '创建成功',
        description: '资源已成功创建',
      })

      router.push('/admin/resources')
      router.refresh()
    } catch (error) {
      console.error('Failed to create resource:', error)
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '无法创建资源',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/admin/resources')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/resources">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">新建资源</h1>
          <p className="text-text-secondary mt-2">
            添加新的设计资源到网站
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <ResourceForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  )
}
