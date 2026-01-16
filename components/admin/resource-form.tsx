'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { CreateResourceSchema, type CreateResourceRequest, type ResourceResponse } from '@/types/resource'
import categories from '@/data/categories.json'

interface ResourceFormProps {
  resource?: ResourceResponse
  onSubmit: (data: CreateResourceRequest) => Promise<void>
  onCancel: () => void
}

export function ResourceForm({ resource, onSubmit, onCancel }: ResourceFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const form = useForm<CreateResourceRequest>({
    resolver: zodResolver(CreateResourceSchema),
    defaultValues: resource
      ? {
          name: resource.name,
          url: resource.url,
          description: resource.description,
          categoryId: resource.category_id,
          tags: resource.tags,
          curatorNote: resource.curator_note,
          isFeatured: resource.is_featured,
          curatorRating: resource.curator_rating,
        }
      : {
          name: '',
          url: '',
          description: '',
          categoryId: '',
          tags: [],
          curatorNote: '',
          isFeatured: false,
          curatorRating: {
            overall: 4.0,
            usability: 4.0,
            aesthetics: 4.0,
            updateFrequency: 4.0,
            freeLevel: 4.0,
          },
        },
  })

  const handleSubmit = async (data: CreateResourceRequest) => {
    try {
      setSubmitting(true)
      await onSubmit(data)
    } finally {
      setSubmitting(false)
    }
  }

  // 添加标签
  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag) return

    const currentTags = form.getValues('tags')
    if (currentTags.includes(tag)) {
      setTagInput('')
      return
    }

    if (currentTags.length >= 10) {
      form.setError('tags', { message: '标签不能超过 10 个' })
      return
    }

    form.setValue('tags', [...currentTags, tag])
    setTagInput('')
    form.clearErrors('tags')
  }

  // 删除标签
  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags')
    form.setValue(
      'tags',
      currentTags.filter((t) => t !== tag)
    )
  }

  // 评分星级组件
  const RatingInput = ({ name, label }: { name: keyof CreateResourceRequest['curatorRating']; label: string }) => {
    const value = form.watch(`curatorRating.${name}`)

    return (
      <FormField
        control={form.control}
        name={`curatorRating.${name}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => field.onChange(rating)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          rating <= value
                            ? 'fill-highlight text-highlight'
                            : 'text-border'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm font-medium min-w-[40px]">
                  {value.toFixed(1)}
                </span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">基本信息</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>资源名称</FormLabel>
                <FormControl>
                  <Input placeholder="例如：Coolors" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>资源链接</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormDescription>
                  资源的官方网站地址
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>资源描述</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="简要描述这个资源的功能和特点..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分类</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标签</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入标签后按回车"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag()
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        添加
                      </Button>
                    </div>
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  至少添加 1 个标签，最多 10 个
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">精选资源</FormLabel>
                  <FormDescription>
                    标记为精选后会在首页展示
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* 策展人笔记 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">策展人笔记</h3>

          <FormField
            control={form.control}
            name="curatorNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>笔记内容</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="分享你对这个资源的看法和使用建议..."
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  策展人的专业评价和推荐理由
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 策展人评分 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">策展人评分</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <RatingInput name="overall" label="综合评分" />
            <RatingInput name="usability" label="易用性" />
            <RatingInput name="aesthetics" label="美观度" />
            <RatingInput name="updateFrequency" label="更新频率" />
            <RatingInput name="freeLevel" label="免费程度" />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            取消
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resource ? '保存修改' : '创建资源'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
