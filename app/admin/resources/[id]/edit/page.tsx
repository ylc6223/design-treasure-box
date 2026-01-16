'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResourceForm } from '@/components/admin/resource-form'
import { toast } from 'sonner'
import type { CreateResourceRequest, ResourceResponse } from '@/types/resource'

export default function EditResourcePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [resource, setResource] = useState<ResourceResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResource = async () => {
      try {
        const response = await fetch(`/api/admin/resources/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to load resource')
        }
        const data = await response.json()
        setResource(data)
      } catch (error) {
        console.error('Failed to load resource:', error)
        toast({
          title: '加载失败',
          description: '无法加载资源信息',
          variant: 'destructive',
        })
        router.push('/admin/resources')
      } finally {
        setLoading(false)
      }
    }

    loadResource()
  }, [params.id, router, toast])

  const handleSubmit = async (data: CreateResourceRequest) => {
    try {
      const response = await fetch(`/api/admin/resources/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update resource')
      }

      toast({
        title: '保存成功',
        description: '资源已成功更新',
      })

      router.push('/admin/resources')
      router.refresh()
    } catch (error) {
      console.error('Failed to update resource:', error)
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '无法更新资源',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/admin/resources')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    )
  }

  if (!resource) {
    return null
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
          <h1 className="text-3xl font-bold tracking-tight">编辑资源</h1>
          <p className="text-text-secondary mt-2">
            修改资源信息
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <ResourceForm
          resource={resource}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
