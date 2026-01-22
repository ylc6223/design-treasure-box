'use client';

import { useState, createElement } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronRight,
  Sparkles,
  Hash,
  Palette,
  Zap,
  LayoutGrid,
  Globe,
  Smartphone,
  Monitor,
  Briefcase,
  Smile,
  Coffee,
} from 'lucide-react';
import type {
  ClarificationStrategy,
  ClarificationQuestion,
  ClarificationOption,
} from '@/lib/ai/clarification-generator';

interface BatchClarificationProps {
  strategy: ClarificationStrategy;
  onComplete: (answers: Record<string, string>) => void;
  className?: string;
}

/**
 * 智能图标映射函数
 */
function getIconForLabel(label: string, value: string): React.ComponentType<any> {
  const text = (label + value).toLowerCase();

  if (text.includes('tech') || text.includes('科技') || text.includes('app')) return Smartphone;
  if (text.includes('mod') || text.includes('现代')) return Zap;
  if (text.includes('min') || text.includes('极简')) return LayoutGrid;
  if (text.includes('bus') || text.includes('商务')) return Briefcase;
  if (text.includes('fun') || text.includes('趣味')) return Smile;
  if (text.includes('cre') || text.includes('创意')) return Palette;
  if (text.includes('web') || text.includes('网')) return Globe;
  if (text.includes('desk') || text.includes('桌面')) return Monitor;
  if (text.includes('mob') || text.includes('移动')) return Smartphone;

  // 默认图标基于首字母或随机分配的视觉类型
  if (value.length % 3 === 0) return Sparkles;
  if (value.length % 3 === 1) return Hash;
  return Coffee;
}

/**
 * 批量澄清组件
 * 支持一次性显示所有问题，用户可以选择性回答
 */
export function BatchClarification({ strategy, onComplete, className }: BatchClarificationProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(
    strategy.questions[0]?.id || null
  );

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === value ? '' : value, // Toggle selection
    }));
  };

  const handleSubmit = () => {
    onComplete(answers);
  };

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const totalQuestions = strategy.questions.length;

  return (
    <div className={cn('space-y-4 max-w-2xl', className)}>
      {/* 提示消息 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 shadow-sm"
      >
        <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {strategy.message || '为了给您最好的推荐，请帮我确认几个问题'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-primary">{answeredCount}</span>/{totalQuestions} 已选
            · 可直接搜索
          </p>
        </div>
      </motion.div>

      {/* 问题列表 */}
      <div className="space-y-3">
        {strategy.questions.map((question, index) => (
          <ClarificationQuestionCard
            key={question.id}
            question={question}
            isExpanded={expandedQuestion === question.id}
            selectedValue={answers[question.id]}
            onToggle={() =>
              setExpandedQuestion(expandedQuestion === question.id ? null : question.id)
            }
            onSelect={(value) => handleSelectOption(question.id, value)}
            index={index}
          />
        ))}
      </div>

      {/* 提交按钮区 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-end pt-2"
      >
        <Button
          onClick={handleSubmit}
          className={cn(
            'gap-2 transition-all duration-300 shadow-md',
            answeredCount > 0
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground px-6'
              : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
          )}
        >
          {answeredCount > 0 ? '确认并搜索' : '跳过，直接搜索'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

interface ClarificationQuestionCardProps {
  question: ClarificationQuestion;
  isExpanded: boolean;
  selectedValue?: string;
  onToggle: () => void;
  onSelect: (value: string) => void;
  index: number;
}

function ClarificationQuestionCard({
  question,
  isExpanded,
  selectedValue,
  onToggle,
  onSelect,
  index,
}: ClarificationQuestionCardProps) {
  const selectedOptionLabel = question.options.find((o) => o.value === selectedValue)?.label;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'group rounded-xl border transition-all duration-200 overflow-hidden',
        isExpanded
          ? 'border-primary/20 bg-card shadow-md ring-1 ring-primary/5'
          : 'border-border/40 bg-card/50 hover:border-border hover:bg-card hover:shadow-sm'
      )}
    >
      {/* 问题标题栏 */}
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-1 h-4 rounded-full transition-colors',
              selectedValue ? 'bg-primary' : 'bg-muted-foreground/30'
            )}
          />
          <span className="text-sm font-medium text-foreground">{question.question}</span>

          {/* 已选状态胶囊 */}
          <AnimatePresence>
            {selectedValue && !isExpanded && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/10 text-xs font-medium text-primary"
              >
                <Check className="h-3 w-3" />
                {selectedOptionLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div
          className={cn(
            'p-1 rounded-full text-muted-foreground transition-all duration-200',
            isExpanded ? 'bg-secondary rotate-180 text-foreground' : 'group-hover:bg-secondary/50'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      {/* 选项网格 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pt-0">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-border/50 to-transparent mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {question.options.map((option) => (
                  <OptionButton
                    key={option.value}
                    option={option}
                    isSelected={selectedValue === option.value}
                    onClick={() => onSelect(option.value)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface OptionButtonProps {
  option: ClarificationOption;
  isSelected: boolean;
  onClick: () => void;
}

function OptionButton({ option, isSelected, onClick }: OptionButtonProps) {
  const IconComponent = getIconForLabel(option.label, option.value);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-start gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border text-left',
        isSelected
          ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 ring-1 ring-primary/20'
          : 'bg-background hover:bg-accent/50 border-border/40 hover:border-primary/30 text-muted-foreground hover:text-foreground'
      )}
    >
      <div
        className={cn(
          'shrink-0 p-1.5 rounded-md transition-colors',
          isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
        )}
      >
        {createElement(IconComponent, { className: 'w-4 h-4' })}
      </div>
      <span className="truncate">{option.label}</span>
      {isSelected && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Check className="w-3.5 h-3.5 opacity-80" />
        </div>
      )}
    </motion.button>
  );
}

/**
 * 简化版快速回复 - 标签云样式
 */
export function QuickSuggestions({
  suggestions,
  onSelect,
  className,
}: {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {suggestions.map((suggestion, i) => (
        <motion.button
          key={suggestion}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(suggestion)}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium',
            'bg-background hover:bg-primary/5 text-muted-foreground hover:text-primary',
            'border border-border/50 hover:border-primary/30',
            'transition-all duration-200 shadow-sm hover:shadow-md'
          )}
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}
