'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceForm } from '@/components/admin/resource-form';
import { toast } from 'sonner';
import type { CreateResourceRequest, ResourceResponse } from '@/types/resource';

export default function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resource, setResource] = useState<ResourceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const loadResource = async () => {
      const { id } = await params;
      setResolvedParams({ id });

      try {
        const response = await fetch(`/api/admin/resources/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load resource');
        }
        const data = await response.json();
        setResource(data);
      } catch (error) {
        console.error('Failed to load resource:', error);
        toast.error('加载失败', {
          description: '无法加载资源信息',
        });
        router.push('/admin/resources');
      } finally {
        setLoading(false);
      }
    };

    loadResource();
  }, [params, router]);

  const handleSubmit = async (data: CreateResourceRequest) => {
    if (!resolvedParams) return;

    try {
      const response = await fetch(`/api/admin/resources/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update resource');
      }

      toast.success('保存成功', {
        description: '资源已成功更新',
      });

      router.push('/admin/resources');
      router.refresh();
    } catch (error) {
      console.error('Failed to update resource:', error);
      toast.error('保存失败', {
        description: error instanceof Error ? error.message : '无法更新资源',
      });
      throw error;
    }
  };

  const handleCancel = () => {
    router.push('/admin/resources');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!resource) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">返回</span>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">编辑资源</h1>
          <p className="text-sm text-muted-foreground">管理资源详细信息和策展内容</p>
        </div>
      </div>

      <ResourceForm resource={resource} onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
