import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreateResourceSchema,
  type CreateResourceRequest,
  type ResourceResponse,
} from '@/types/resource';
import { useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';

interface ResourceFormProps {
  resource?: ResourceResponse;
  onSubmit: (data: CreateResourceRequest) => Promise<void>;
  onCancel: () => void;
}

export function ResourceForm({ resource, onSubmit, onCancel }: ResourceFormProps) {
  const { data: categories = [] } = useCategories();
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

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
  });

  const handleSubmit = async (data: CreateResourceRequest) => {
    try {
      setSubmitting(true);
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  // 添加标签
  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;

    const currentTags = form.getValues('tags');
    if (currentTags.includes(tag)) {
      setTagInput('');
      return;
    }

    if (currentTags.length >= 10) {
      form.setError('tags', { message: '标签不能超过 10 个' });
      return;
    }

    form.setValue('tags', [...currentTags, tag]);
    setTagInput('');
    form.clearErrors('tags');
  };

  // 删除标签
  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags');
    form.setValue(
      'tags',
      currentTags.filter((t) => t !== tag)
    );
  };

  // A clean 5-star rater component
  const CleanRatingInput = ({
    name,
    label,
  }: {
    name: keyof CreateResourceRequest['curatorRating'];
    label: string;
  }) => {
    const value = form.watch(`curatorRating.${name}`);

    return (
      <FormField
        control={form.control}
        name={`curatorRating.${name}`}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between mb-2">
              <FormLabel>{label}</FormLabel>
              <span className="text-sm text-muted-foreground tabular-nums">{value.toFixed(1)}</span>
            </div>
            <FormControl>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => field.onChange(star)}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    <Star
                      className={cn(
                        'h-6 w-6 transition-all',
                        value >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/20 hover:text-yellow-400/50'
                      )}
                    />
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid gap-8">
          {/* Card 1: Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>填写资源的主要内容和分类信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
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
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>资源链接</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="简要描述资源的功能和特点..."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
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
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="输入标签并回车"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag();
                              }
                            }}
                            className="max-w-[240px]"
                          />
                          <Button type="button" variant="secondary" onClick={addTag}>
                            添加
                          </Button>
                        </div>
                        {field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="px-2 py-1 gap-1 text-sm font-normal"
                              >
                                {tag}
                                <span
                                  className="cursor-pointer ml-1 opacity-50 hover:opacity-100"
                                  onClick={() => removeTag(tag)}
                                >
                                  <X className="h-3 w-3" />
                                </span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-muted/20">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">精选资源</FormLabel>
                      <FormDescription>推荐的资源将显示在首页精选栏目中</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 2: Curator Review */}
          <Card>
            <CardHeader>
              <CardTitle>策展评估</CardTitle>
              <CardDescription>主要用于内部评分和审核记录</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="curatorNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>策展人笔记</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="记录您的评估意见..."
                        className="resize-y min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                <CleanRatingInput name="overall" label="综合评分" />
                <CleanRatingInput name="usability" label="易用性" />
                <CleanRatingInput name="aesthetics" label="美观度" />
                <CleanRatingInput name="updateFrequency" label="更新频率" />
                <CleanRatingInput name="freeLevel" label="免费程度" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            取消
          </Button>
          <Button type="submit" disabled={submitting} className="min-w-[120px]">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {resource ? '保存更改' : '创建资源'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
