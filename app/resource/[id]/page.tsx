'use client';

import * as React from 'react';
import { RatingBreakdown } from '@/components/rating-breakdown';
import { ResourceCard } from '@/components/resource-card';
import { ResourceThumbnail } from '@/components/resource-thumbnail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/hooks/use-favorites';
import { useResourceById, useResources } from '@/hooks/use-resources';
import { ArrowLeft, Heart, Sparkles, Share2, Globe, Calendar, Eye, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/use-categories';
import { RatingSection } from './rating-section';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ResourceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { data: categories = [] } = useCategories();
  const { data: resource, isLoading } = useResourceById(resolvedParams.id);
  const { data: allResources } = useResources();
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();

  const relatedResources = allResources
    ?.filter((r) => r.categoryId === resource?.categoryId && r.id !== resource?.id)
    .slice(0, 4);

  const category = categories.find((cat) => cat.id === resource?.categoryId);

  const handleFavorite = (resourceId: string) => {
    if (isFavorited(resourceId)) {
      removeFavorite(resourceId);
    } else {
      addFavorite(resourceId);
    }
  };

  const handleVisit = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">正在探索资源...</p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">404</h1>
            <p className="text-xl font-medium text-muted-foreground">资源已在星辰中消失</p>
            <p className="text-sm text-muted-foreground">
              抱歉，您访问的资源可能已被移除或地址错误。
            </p>
          </div>
          <Button onClick={() => router.push('/')} className="rounded-full px-8" variant="default">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回宝箱首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground animate-fade-in">
      {/* Immersive Header/Hero Area */}
      <div className="relative border-b bg-muted/30">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8 lg:mb-12">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-background/80"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Visual Preview */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="group relative aspect-video overflow-hidden rounded-2xl bg-muted shadow-2xl transition-all duration-500 hover:shadow-primary/5">
                <ResourceThumbnail
                  screenshotUrl={resource.screenshotUrl ?? undefined}
                  name={resource.name}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {resource.isFeatured && (
                  <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg animate-bounce-subtle">
                    <Sparkles className="h-4 w-4" />
                    编辑精选
                  </div>
                )}
              </div>
            </div>

            {/* Core Info & Actions */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  {category && (
                    <span className="text-sm font-bold uppercase tracking-widest text-primary/60">
                      {category.name}
                    </span>
                  )}
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight">
                    {resource.name}
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  {resource.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-muted hover:bg-muted/80 px-3 py-1 font-medium transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  onClick={() => handleVisit(resource.url)}
                  size="lg"
                  className="flex-1 rounded-xl h-14 text-lg font-bold shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95"
                >
                  <Globe className="mr-2 h-5 w-5" />
                  访问网站
                </Button>
                <Button
                  variant={isFavorited(resource.id) ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleFavorite(resource.id)}
                  className={cn(
                    'flex-1 rounded-xl h-14 text-lg font-bold transition-all active:scale-95',
                    isFavorited(resource.id) ? 'shadow-xl shadow-primary/10' : ''
                  )}
                >
                  <Heart
                    className={cn(
                      'mr-2 h-5 w-5 transition-transform duration-300',
                      isFavorited(resource.id) ? 'fill-current scale-110' : ''
                    )}
                  />
                  {isFavorited(resource.id) ? '已收藏' : '加入收藏'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details & Secondary Content Area */}
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Left Column: Detailed Insights */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-16">
            {/* Curator Recommendation (The highlight box) */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold tracking-tight">策展人见解</h2>
              </div>
              <div className="relative p-8 lg:p-10 rounded-3xl bg-muted/40 border-2 border-dashed border-muted-foreground/10 group">
                <p className="text-xl italic text-foreground/80 leading-relaxed font-serif">
                  &quot;{resource.curatorNote}&quot;
                </p>
                <div className="absolute -bottom-3 -right-3 h-12 w-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            </section>

            {/* Related Resources Grid */}
            {relatedResources && relatedResources.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-2xl font-bold tracking-tight">发现相似好物</h2>
                  </div>
                  <Button variant="link" className="font-bold">
                    查看全部
                  </Button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {relatedResources.map((relatedResource) => (
                    <ResourceCard
                      key={relatedResource.id}
                      resource={relatedResource}
                      isFavorited={isFavorited(relatedResource.id)}
                      onFavorite={() => handleFavorite(relatedResource.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Information Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-10">
            {/* Stats Overview */}
            <section className="p-6 lg:p-8 rounded-3xl border bg-card/50 backdrop-blur-sm space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                资源详情统计
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    {resource.viewCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                    浏览次数
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-rose-500" />
                    {resource.favoriteCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                    收藏人气
                  </p>
                </div>
                <div className="space-y-1 col-span-2 pt-4 border-t">
                  <p className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground/50" />
                    {new Date(resource.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                    收录日期
                  </p>
                </div>
              </div>
            </section>

            {/* Ratings Breakdown Section */}
            <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2">
                策展评价模型
              </h3>
              <Card className="rounded-3xl border-none bg-muted/20">
                <CardContent className="pt-6">
                  <RatingBreakdown rating={resource.rating} />
                </CardContent>
              </Card>
            </section>

            {/* User Rating Access */}
            <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2">
                社区共建评分
              </h3>
              <div className="p-6 lg:p-8 rounded-3xl border bg-surface hover:border-primary/20 transition-colors shadow-sm">
                <RatingSection resource={resource} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
