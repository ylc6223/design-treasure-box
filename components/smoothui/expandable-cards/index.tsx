"use client";

import { Heart, ExternalLink, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types";

const EASING_X1 = 0.4;
const EASING_Y1 = 0.0;
const EASING_X2 = 0.2;
const EASING_Y2 = 1;

const smoothEasing = [EASING_X1, EASING_Y1, EASING_X2, EASING_Y2] as const;

export type ExpandableCardsProps = {
  resources: Resource[];
  selectedCard?: string | null;
  onSelect?: (id: string | null) => void;
  isFavorited: (id: string) => boolean;
  onFavorite: (id: string) => void;
  onVisit: (url: string) => void;
  className?: string;
  cardClassName?: string;
};

export default function ExpandableCards({
  resources,
  selectedCard: controlledSelected,
  onSelect,
  isFavorited,
  onFavorite,
  onVisit,
  className = "",
  cardClassName = "",
}: ExpandableCardsProps) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedCard =
    controlledSelected !== undefined ? controlledSelected : internalSelected;

  useEffect(() => {
    // 移除自动居中滚动，保持靠左对齐
  }, []);

  const handleCardClick = (id: string) => {
    if (selectedCard === id) {
      if (onSelect) {
        onSelect(null);
      } else {
        setInternalSelected(null);
      }
    } else {
      if (onSelect) {
        onSelect(id);
      } else {
        setInternalSelected(id);
      }
      // Center the clicked card in view
      const cardElement = document.querySelector(`[data-card-id="${id}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  };

  return (
    <div
      className={`flex w-full flex-col gap-4 p-4 ${className}`}
    >
      <div
        className="flex overflow-x-auto pt-4 pb-8 scrollbar-hide"
        ref={scrollRef}
        style={{
          scrollSnapType: "x mandatory",
        }}
      >
        {resources.map((resource) => (
          <motion.div
            animate={{
              width: selectedCard === resource.id ? "420px" : "240px",
            }}
            className={`relative mr-4 h-[280px] shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-background shadow-lg ${cardClassName}`}
            data-card-id={resource.id}
            key={resource.id}
            layout
            onClick={() => handleCardClick(resource.id)}
            style={{
              scrollSnapAlign: "start",
            }}
            transition={{
              duration: 0.5,
              ease: smoothEasing,
            }}
          >
            {/* 左侧：始终可见的缩略图和基本信息 */}
            <div className="relative h-full w-[240px]">
              {/* 图片 */}
              <img
                alt={resource.name}
                className="h-full w-full object-cover"
                src={resource.screenshot}
              />
              
              {/* 图片上的叠加信息 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              {/* 精选标识 */}
              {resource.isFeatured && (
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-[var(--highlight)] px-2 py-0.5">
                  <Sparkles className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">精选</span>
                </div>
              )}

              {/* 收藏按钮 */}
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFavorite(resource.id)
                  }}
                  className={cn(
                    "h-8 w-8 bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors",
                    isFavorited(resource.id) && "text-red-500 hover:text-red-600"
                  )}
                  aria-label={isFavorited(resource.id) ? "取消收藏" : "收藏"}
                >
                  <Heart className={cn("h-4 w-4", isFavorited(resource.id) && "fill-current")} />
                </Button>
              </div>

              {/* 底部信息 */}
              <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                <div>
                  <h3 className="font-semibold text-base text-white line-clamp-1">
                    {resource.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <RatingStars rating={resource.rating.overall} size="sm" />
                    <span className="text-xs text-white/90">
                      {resource.rating.overall.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs px-1.5 py-0 h-5 bg-white/20 text-white border-white/30 backdrop-blur-sm"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1.5 py-0 h-5 bg-white/20 text-white border-white/30 backdrop-blur-sm"
                    >
                      +{resource.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：展开时显示的详细信息 */}
            <AnimatePresence mode="popLayout">
              {selectedCard === resource.id && (
                <motion.div
                  animate={{ width: "180px", opacity: 1, filter: "blur(0px)" }}
                  className="absolute top-0 right-0 h-full bg-background border-l"
                  exit={{ width: 0, opacity: 0, filter: "blur(5px)" }}
                  initial={{ width: 0, opacity: 0, filter: "blur(5px)" }}
                  transition={{
                    duration: 0.5,
                    ease: smoothEasing,
                    opacity: { duration: 0.3, delay: 0.2 },
                  }}
                >
                  <motion.div
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    className="flex h-full flex-col justify-between p-3"
                    exit={{ opacity: 0, x: 20, filter: "blur(5px)" }}
                    initial={{ opacity: 0, x: 20, filter: "blur(5px)" }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    {/* 描述 */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                        简介
                      </h4>
                      <p className="text-xs text-foreground leading-relaxed">
                        {resource.description}
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-1.5">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          onVisit(resource.url)
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        访问
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

