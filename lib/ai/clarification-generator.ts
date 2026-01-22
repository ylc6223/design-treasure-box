/**
 * 澄清问题生成器 (Clarification Generator)
 *
 * 根据查询分析结果生成澄清问题
 * 基于 technical-specification.md 1.5 节设计
 */

import type { SearchDimensions, QueryAnalysis } from './query-analyzer';
import { getMissingDimensions } from './query-analyzer';

// ============ 类型定义 ============

/**
 * 澄清问题
 */
export interface ClarificationQuestion {
  id: string;
  question: string;
  options: ClarificationOption[];
  aspect: 'industry' | 'style' | 'type' | 'color';
  priority: number; // 1-3, 越小越重要
}

/**
 * 澄清选项
 */
export interface ClarificationOption {
  value: string;
  label: string;
  emoji?: string;
}

/**
 * 澄清模式
 */
export enum ClarificationMode {
  BATCH = 'batch', // 一次性显示所有问题
  SINGLE = 'single', // 逐个提问
  NON_INTRUSIVE = 'suggestions', // 结果旁的非侵入式建议
}

/**
 * 澄清策略结果
 */
export interface ClarificationStrategy {
  mode: ClarificationMode;
  questions: ClarificationQuestion[];
  message?: string;
}

// ============ 澄清问题模板 ============

/**
 * 行业澄清问题模板
 */
const INDUSTRY_QUESTION: Omit<ClarificationQuestion, 'id'> = {
  question: '用在什么行业？',
  aspect: 'industry',
  priority: 1,
  options: [
    { value: '医疗', label: '医疗健康', emoji: '🏥' },
    { value: '金融', label: '金融理财', emoji: '💰' },
    { value: '教育', label: '教育培训', emoji: '📚' },
    { value: '电商', label: '电商零售', emoji: '🛒' },
    { value: 'SaaS', label: '企业SaaS', emoji: '💼' },
    { value: '科技', label: '科技互联网', emoji: '🚀' },
  ],
};

/**
 * 风格澄清问题模板
 */
const STYLE_QUESTION: Omit<ClarificationQuestion, 'id'> = {
  question: '喜欢什么风格？',
  aspect: 'style',
  priority: 2,
  options: [
    { value: '极简', label: '极简主义', emoji: '⬜' },
    { value: '3D', label: '3D立体', emoji: '🎲' },
    { value: '扁平', label: '扁平化', emoji: '📋' },
    { value: '渐变', label: '渐变色彩', emoji: '🌈' },
    { value: '暗黑', label: '暗黑模式', emoji: '🌙' },
    { value: '科技感', label: '科技未来', emoji: '⚡' },
  ],
};

/**
 * 类型澄清问题模板
 */
const TYPE_QUESTION: Omit<ClarificationQuestion, 'id'> = {
  question: '需要什么类型的资源？',
  aspect: 'type',
  priority: 1,
  options: [
    { value: '网站', label: '网站设计', emoji: '🌐' },
    { value: '图标', label: '图标素材', emoji: '🎨' },
    { value: 'APP', label: 'APP界面', emoji: '📱' },
    { value: '后台', label: '后台管理', emoji: '📊' },
    { value: '落地页', label: '落地页', emoji: '📄' },
    { value: 'UI套件', label: 'UI组件', emoji: '🧩' },
  ],
};

/**
 * 颜色澄清问题模板（可选，优先级最低）
 */
const COLOR_QUESTION: Omit<ClarificationQuestion, 'id'> = {
  question: '有颜色偏好吗？',
  aspect: 'color',
  priority: 3,
  options: [
    { value: '蓝色', label: '蓝色系', emoji: '🔵' },
    { value: '绿色', label: '绿色系', emoji: '🟢' },
    { value: '红色', label: '红色系', emoji: '🔴' },
    { value: '紫色', label: '紫色系', emoji: '🟣' },
    { value: '黑色', label: '黑白灰', emoji: '⚫' },
    { value: '', label: '都可以', emoji: '🎨' },
  ],
};

/**
 * 维度到问题模板的映射
 */
const DIMENSION_QUESTIONS: Record<string, Omit<ClarificationQuestion, 'id'>> = {
  industry: INDUSTRY_QUESTION,
  style: STYLE_QUESTION,
  type: TYPE_QUESTION,
  color: COLOR_QUESTION,
};

// ============ 核心函数 ============

/**
 * 生成澄清问题
 *
 * @param analysis - 查询分析结果
 * @param maxQuestions - 最大问题数量（默认3）
 * @returns 澄清问题列表
 */
export function generateClarificationQuestions(
  analysis: QueryAnalysis,
  maxQuestions: number = 3
): ClarificationQuestion[] {
  const missingDimensions = getMissingDimensions(analysis.dimensions);

  if (missingDimensions.length === 0) {
    return [];
  }

  // 根据缺失维度生成问题
  const questions: ClarificationQuestion[] = missingDimensions
    .map((dim) => {
      const template = DIMENSION_QUESTIONS[dim];
      if (!template) return null;

      return {
        id: `clarify-${dim}-${Date.now()}`,
        ...template,
      };
    })
    .filter((q): q is ClarificationQuestion => q !== null)
    // 按优先级排序
    .sort((a, b) => a.priority - b.priority)
    // 限制数量
    .slice(0, maxQuestions);

  return questions;
}

/**
 * 确定澄清模式
 *
 * @param analysis - 查询分析结果
 * @param sessionHistory - 会话历史消息数量
 * @param recentEditCount - 最近编辑次数（用于检测用户挫折）
 * @returns 澄清模式
 */
export function determineClarificationMode(
  analysis: QueryAnalysis,
  sessionHistory: number = 0,
  recentEditCount: number = 0
): ClarificationMode {
  // 1. 检查用户是否在反复编辑（挫折信号）
  if (recentEditCount >= 2) {
    return ClarificationMode.NON_INTRUSIVE;
  }

  // 2. 查询复杂度分析
  const wordCount = analysis.extractedKeywords.length;
  const dimensionCount = Object.values(analysis.dimensions).filter(Boolean).length;

  // 简单查询（≤2词，无维度） → 批量澄清
  if (wordCount <= 2 && dimensionCount === 0) {
    return ClarificationMode.BATCH;
  }

  // 复杂查询（≥4词或≥3维度） → 非侵入式
  if (wordCount >= 4 || dimensionCount >= 3) {
    return ClarificationMode.NON_INTRUSIVE;
  }

  // 3. 根据会话阶段决定
  if (sessionHistory === 0) {
    // 新会话 → 批量澄清
    return ClarificationMode.BATCH;
  }

  // 默认：非侵入式建议
  return ClarificationMode.NON_INTRUSIVE;
}

/**
 * 生成完整的澄清策略
 *
 * @param analysis - 查询分析结果
 * @param sessionHistory - 会话历史消息数量
 * @param recentEditCount - 最近编辑次数
 * @returns 澄清策略
 */
export function generateClarificationStrategy(
  analysis: QueryAnalysis,
  sessionHistory: number = 0,
  recentEditCount: number = 0
): ClarificationStrategy {
  const mode = determineClarificationMode(analysis, sessionHistory, recentEditCount);
  const questions = generateClarificationQuestions(analysis);

  // 根据模式生成提示消息
  let message: string | undefined;

  switch (mode) {
    case ClarificationMode.BATCH:
      message = '为了给您最好的推荐，帮我确认几个问题：';
      break;
    case ClarificationMode.SINGLE:
      message = questions[0]?.question;
      break;
    case ClarificationMode.NON_INTRUSIVE:
      message = '💡 想更精确？试试告诉我行业或风格';
      break;
  }

  return {
    mode,
    questions: mode === ClarificationMode.SINGLE ? questions.slice(0, 1) : questions,
    message,
  };
}

/**
 * 应用澄清回答到搜索维度
 *
 * @param currentDimensions - 当前搜索维度
 * @param answer - 用户回答
 * @param aspect - 回答对应的维度
 * @returns 更新后的搜索维度
 */
export function applyClarificationAnswer(
  currentDimensions: SearchDimensions,
  answer: string,
  aspect: 'industry' | 'style' | 'type' | 'color'
): SearchDimensions {
  if (!answer || answer.trim() === '') {
    return currentDimensions;
  }

  return {
    ...currentDimensions,
    [aspect]: answer,
  };
}

/**
 * 生成快速回复文本
 *
 * @param option - 选择的选项
 * @returns 用于显示的快速回复文本
 */
export function formatQuickReply(option: ClarificationOption): string {
  if (option.emoji) {
    return `${option.emoji} ${option.label}`;
  }
  return option.label;
}

/**
 * 判断是否需要澄清
 *
 * @param analysis - 查询分析结果
 * @returns 是否需要澄清
 */
export function shouldClarify(analysis: QueryAnalysis): boolean {
  // 如果置信度高且有足够维度，不需要澄清
  if (analysis.confidence >= 0.7 && analysis.clarity === 'clear') {
    return false;
  }

  // 如果缺失重要维度，需要澄清
  const missingDimensions = getMissingDimensions(analysis.dimensions);
  const hasCriticalMissing =
    missingDimensions.includes('industry') || missingDimensions.includes('type');

  return analysis.requiresClarification || hasCriticalMissing;
}
