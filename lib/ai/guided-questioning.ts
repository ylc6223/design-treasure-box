/**
 * 引导式提问引擎
 * 分析查询清晰度并生成澄清问题
 */

import type { QueryAnalysis } from '@/types/ai-chat';

/**
 * 引导式提问引擎类
 */
export class GuidedQuestioningEngine {
  /**
   * 分析查询清晰度
   */
  analyzeQueryClarity(query: string): QueryAnalysis {
    const queryLower = query.toLowerCase().trim();

    // 检查查询长度
    if (queryLower.length < 3) {
      return {
        clarity: 'vague',
        missingAspects: ['category', 'style', 'audience', 'purpose'],
        confidence: 0.9,
      };
    }

    const missingAspects: ('category' | 'style' | 'audience' | 'purpose')[] = [];
    let clarity: 'clear' | 'vague' | 'ambiguous' = 'clear';

    // 检查是否包含类别信息
    const hasCategory = this.hasCategory(queryLower);
    if (!hasCategory) {
      missingAspects.push('category');
    }

    // 检查是否包含风格信息
    const hasStyle = this.hasStyle(queryLower);
    if (!hasStyle) {
      missingAspects.push('style');
    }

    // 检查是否包含受众信息
    const hasAudience = this.hasAudience(queryLower);
    if (!hasAudience) {
      missingAspects.push('audience');
    }

    // 检查是否包含目的信息
    const hasPurpose = this.hasPurpose(queryLower);
    if (!hasPurpose) {
      missingAspects.push('purpose');
    }

    // 判断清晰度
    if (missingAspects.length === 0) {
      clarity = 'clear';
    } else if (missingAspects.length >= 3) {
      clarity = 'vague';
    } else {
      clarity = 'ambiguous';
    }

    // 计算置信度
    const confidence = this.calculateConfidence(queryLower, missingAspects.length);

    return {
      clarity,
      missingAspects,
      confidence,
    };
  }

  /**
   * 生成澄清问题
   */
  generateClarificationQuestions(analysis: QueryAnalysis): string[] {
    const questions: string[] = [];

    for (const aspect of analysis.missingAspects) {
      const question = this.getQuestionForAspect(aspect);
      if (question) {
        questions.push(question);
      }
    }

    // 限制问题数量，避免过多
    return questions.slice(0, 3);
  }

  /**
   * 判断是否需要澄清
   */
  shouldAskForClarification(analysis: QueryAnalysis): boolean {
    // 只有在查询非常模糊（缺少所有方面或几乎所有方面）且置信度高时才需要澄清
    if (analysis.clarity === 'vague' && analysis.missingAspects.length >= 4 && analysis.confidence > 0.8) {
      return true;
    }

    // 如果查询太短且缺少多个方面，需要澄清
    if (analysis.clarity === 'vague' && analysis.confidence > 0.85) {
      return true;
    }

    return false;
  }

  /**
   * 检查是否包含类别信息
   */
  private hasCategory(query: string): boolean {
    const categoryKeywords = [
      '配色', '颜色', 'color',
      'css', '样式', '框架',
      '字体', 'font', '文字',
      '图标', 'icon',
      '灵感', '设计', 'inspiration',
      '网站', 'website', '网页',
      'ui', '组件', 'component',
      '样机', 'mockup',
    ];

    return categoryKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * 检查是否包含风格信息
   */
  private hasStyle(query: string): boolean {
    const styleKeywords = [
      '简洁', '简约', '极简', 'minimal',
      '现代', 'modern',
      '复古', 'vintage', 'retro',
      '扁平', 'flat',
      '立体', '3d',
      '手绘', 'hand-drawn',
      '专业', 'professional',
      '可爱', 'cute',
      '优雅', 'elegant',
      '炫酷', 'cool',
    ];

    return styleKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * 检查是否包含受众信息
   */
  private hasAudience(query: string): boolean {
    const audienceKeywords = [
      '新手', '初学者', 'beginner',
      '专业', 'professional', '高级',
      '学生', 'student',
      '开发者', 'developer', '程序员',
      '设计师', 'designer',
      '年轻', 'young',
      '企业', 'enterprise', '商业',
    ];

    return audienceKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * 检查是否包含目的信息
   */
  private hasPurpose(query: string): boolean {
    const purposeKeywords = [
      '学习', 'learn', '教程',
      '项目', 'project',
      '工作', 'work',
      '练习', 'practice',
      '参考', 'reference',
      '快速', 'quick', '快捷',
      '详细', 'detailed',
      '免费', 'free',
      '商用', 'commercial',
    ];

    return purposeKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(query: string, missingCount: number): number {
    let confidence = 0.5;

    // 查询长度影响置信度
    if (query.length < 5) {
      confidence += 0.3;
    } else if (query.length < 10) {
      confidence += 0.2;
    } else if (query.length > 30) {
      confidence -= 0.1;
    }

    // 缺失方面数量影响置信度
    confidence += missingCount * 0.1;

    // 限制在0-1范围内
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 根据缺失方面生成问题
   */
  private getQuestionForAspect(
    aspect: 'category' | 'style' | 'audience' | 'purpose'
  ): string | null {
    const questions: Record<string, string> = {
      category: '您需要哪个类别的资源？（例如：配色工具、CSS框架、字体、图标等）',
      style: '您偏好什么风格的设计？（例如：简约、现代、复古等）',
      audience: '这个资源主要面向什么人群？（例如：新手、专业设计师、开发者等）',
      purpose: '您使用这个资源的主要目的是什么？（例如：学习、项目开发、快速参考等）',
    };

    return questions[aspect] || null;
  }

  /**
   * 根据用户回答更新查询
   */
  refineQuery(originalQuery: string, clarificationAnswer: string): string {
    // 简单地将澄清答案附加到原始查询
    return `${originalQuery} ${clarificationAnswer}`.trim();
  }

  /**
   * 生成建议查询
   */
  generateSuggestedQueries(query: string): string[] {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // 基于查询内容生成建议
    if (queryLower.includes('配色') || queryLower.includes('颜色')) {
      suggestions.push('推荐免费的配色工具');
      suggestions.push('适合新手的配色方案生成器');
      suggestions.push('专业的配色设计工具');
    } else if (queryLower.includes('css') || queryLower.includes('框架')) {
      suggestions.push('流行的CSS框架');
      suggestions.push('轻量级CSS库');
      suggestions.push('CSS动画工具');
    } else if (queryLower.includes('字体')) {
      suggestions.push('免费商用字体');
      suggestions.push('中文字体库');
      suggestions.push('字体配对工具');
    } else if (queryLower.includes('图标')) {
      suggestions.push('免费图标库');
      suggestions.push('SVG图标集合');
      suggestions.push('可定制的图标工具');
    } else {
      // 通用建议
      suggestions.push('推荐高评分的设计工具');
      suggestions.push('适合新手的设计资源');
      suggestions.push('免费的设计灵感网站');
    }

    return suggestions.slice(0, 3);
  }
}
