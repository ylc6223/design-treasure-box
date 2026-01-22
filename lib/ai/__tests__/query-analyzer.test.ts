/**
 * 查询分析器单元测试
 *
 * 覆盖核心功能：意图识别、维度提取、置信度计算
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeQuery,
  extractKeywords,
  calculateKeywordDensity,
  extractDimensions,
  calculateConfidence,
  classifyIntent,
  getMissingDimensions,
  type SearchDimensions,
} from '../query-analyzer';

describe('QueryAnalyzer', () => {
  // ============ 基础分析测试 ============

  describe('analyzeQuery', () => {
    it('应正确分析简单查询', async () => {
      const result = await analyzeQuery('医疗图标');

      expect(result.intent).toBe('search');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.clarity).toBeDefined();
      expect(result.dimensions.industry).toBe('医疗');
      expect(result.dimensions.type).toBe('图标');
    });

    it('应识别模糊查询并要求澄清', async () => {
      const result = await analyzeQuery('图标');

      expect(result.keywordDensity).toBe('low');
      expect(result.requiresClarification).toBe(true);
    });

    it('应正确分析复杂查询', async () => {
      const result = await analyzeQuery('红色 3D 医疗 图标');

      expect(result.keywordDensity).toBe('high');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.dimensions.color).toBe('红色');
      expect(result.dimensions.style).toBe('3D');
      expect(result.dimensions.industry).toBe('医疗');
      expect(result.dimensions.type).toBe('图标');
    });

    it('应继承会话上下文', async () => {
      const context: SearchDimensions = { industry: '金融' };
      const result = await analyzeQuery('极简风格', context);

      expect(result.dimensions.industry).toBe('金融');
      expect(result.dimensions.style).toBe('极简');
    });
  });

  // ============ 意图分类测试 ============

  describe('classifyIntent', () => {
    it('应检测到纠正意图 - "不对"', async () => {
      const result = await analyzeQuery('不对，要红色的');
      expect(result.intent).toBe('correction');
    });

    it('应检测到纠正意图 - "不要"', async () => {
      const result = await analyzeQuery('不要这种风格');
      expect(result.intent).toBe('correction');
    });

    it('应检测到纠正意图 - "换个"', async () => {
      const result = await analyzeQuery('换个颜色');
      expect(result.intent).toBe('correction');
    });

    it('应检测到探索意图 - "灵感"', async () => {
      const result = await analyzeQuery('给我一些灵感');
      expect(result.intent).toBe('inspiration');
    });

    it('应检测到探索意图 - "推荐"', async () => {
      const result = await analyzeQuery('推荐一些好的网站');
      expect(result.intent).toBe('inspiration');
    });

    it('应检测到探索意图 - "有什么"', async () => {
      const result = await analyzeQuery('有什么好看的设计');
      expect(result.intent).toBe('inspiration');
    });

    it('应默认为搜索意图', async () => {
      const result = await analyzeQuery('医疗图标');
      expect(result.intent).toBe('search');
    });

    it('空查询应返回blocked意图', () => {
      const result = classifyIntent('', {});
      expect(result).toBe('blocked');
    });
  });

  // ============ 关键词提取测试 ============

  describe('extractKeywords', () => {
    it('应正确提取关键词并过滤停用词', () => {
      const keywords = extractKeywords('给我找一个医疗的网站');

      expect(keywords).not.toContain('给');
      expect(keywords).not.toContain('我');
      expect(keywords).not.toContain('一个');
      expect(keywords).not.toContain('的');
      // 使用灵活断言，因为分词可能返回不同格式
      expect(keywords.some((k) => k.includes('医疗'))).toBe(true);
      expect(keywords.some((k) => k.includes('网站'))).toBe(true);
    });

    it('应处理英文混合查询', () => {
      const keywords = extractKeywords('3D icon design');

      // 英文保持原大小写
      expect(keywords.some((k) => k.toLowerCase() === '3d')).toBe(true);
      expect(keywords.some((k) => k.toLowerCase() === 'icon')).toBe(true);
      expect(keywords.some((k) => k.toLowerCase() === 'design')).toBe(true);
    });

    it('应处理标点符号', () => {
      const keywords = extractKeywords('医疗，网站，图标');

      expect(keywords).toContain('医疗');
      expect(keywords).toContain('网站');
      expect(keywords).toContain('图标');
    });
  });

  // ============ 关键词密度测试 ============

  describe('calculateKeywordDensity', () => {
    it('单个关键词应返回low', () => {
      expect(calculateKeywordDensity(['图标'])).toBe('low');
    });

    it('2-3个关键词应返回medium', () => {
      expect(calculateKeywordDensity(['医疗', '图标'])).toBe('medium');
      expect(calculateKeywordDensity(['红色', '医疗', '图标'])).toBe('medium');
    });

    it('4个及以上关键词应返回high', () => {
      expect(calculateKeywordDensity(['红色', '3D', '医疗', '图标'])).toBe('high');
      expect(calculateKeywordDensity(['红色', '3D', '极简', '医疗', '图标'])).toBe('high');
    });

    it('空数组应返回low', () => {
      expect(calculateKeywordDensity([])).toBe('low');
    });
  });

  // ============ 维度提取测试 ============

  describe('extractDimensions', () => {
    it('应正确提取行业维度', () => {
      const dims = extractDimensions('医疗行业网站');
      expect(dims.industry).toBe('医疗');
    });

    it('应正确提取风格维度', () => {
      const dims = extractDimensions('极简风格设计');
      expect(dims.style).toBe('极简');
    });

    it('应正确提取类型维度', () => {
      const dims = extractDimensions('icon设计');
      expect(dims.type).toBe('图标');
    });

    it('应正确提取颜色维度', () => {
      const dims = extractDimensions('蓝色网站');
      expect(dims.color).toBe('蓝色');
    });

    it('应提取多个维度', () => {
      const dims = extractDimensions('蓝色极简金融网站');

      expect(dims.color).toBe('蓝色');
      expect(dims.style).toBe('极简');
      expect(dims.industry).toBe('金融');
      expect(dims.type).toBe('网站');
    });

    it('应继承上下文维度', () => {
      const context: SearchDimensions = { industry: '教育' };
      const dims = extractDimensions('极简风格', context);

      expect(dims.industry).toBe('教育');
      expect(dims.style).toBe('极简');
    });

    it('新提取的维度应覆盖上下文', () => {
      const context: SearchDimensions = { industry: '教育' };
      const dims = extractDimensions('金融网站', context);

      expect(dims.industry).toBe('金融');
    });
  });

  // ============ 置信度计算测试 ============

  describe('calculateConfidence', () => {
    it('低密度+无维度应返回低置信度', () => {
      const conf = calculateConfidence('low', {});
      expect(conf).toBeLessThan(0.5);
    });

    it('中密度+单维度应返回中等置信度', () => {
      const conf = calculateConfidence('medium', { industry: '医疗' });
      expect(conf).toBeGreaterThanOrEqual(0.5);
      expect(conf).toBeLessThan(0.8);
    });

    it('高密度+多维度应返回高置信度', () => {
      const conf = calculateConfidence('high', {
        industry: '医疗',
        style: '极简',
        type: '网站',
      });
      expect(conf).toBeGreaterThanOrEqual(0.8);
    });

    it('置信度应不超过1', () => {
      const conf = calculateConfidence('high', {
        industry: '医疗',
        style: '极简',
        type: '网站',
        color: '蓝色',
      });
      expect(conf).toBeLessThanOrEqual(1);
    });
  });

  // ============ 缺失维度测试 ============

  describe('getMissingDimensions', () => {
    it('应识别所有缺失维度', () => {
      const missing = getMissingDimensions({});

      expect(missing).toContain('industry');
      expect(missing).toContain('style');
      expect(missing).toContain('type');
      expect(missing).not.toContain('color'); // 颜色是可选的
    });

    it('应不包含已有维度', () => {
      const missing = getMissingDimensions({ industry: '医疗', style: '极简' });

      expect(missing).not.toContain('industry');
      expect(missing).not.toContain('style');
      expect(missing).toContain('type');
    });

    it('完整维度应返回空数组', () => {
      const missing = getMissingDimensions({
        industry: '医疗',
        style: '极简',
        type: '网站',
      });

      expect(missing).toHaveLength(0);
    });
  });

  // ============ 边界情况测试 ============

  describe('边界情况', () => {
    it('应处理空字符串', async () => {
      const result = await analyzeQuery('');

      expect(result.intent).toBe('blocked');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('应处理纯空格', async () => {
      const result = await analyzeQuery('   ');

      expect(result.intent).toBe('blocked');
    });

    it('应处理特殊字符', async () => {
      const result = await analyzeQuery('!!!???');

      expect(result.keywordDensity).toBe('low');
      expect(result.extractedKeywords).toHaveLength(0);
    });

    it('应处理超长查询', async () => {
      const longQuery = '医疗 金融 教育 电商 科技 游戏 社交 餐饮 旅游 极简 3D 扁平';
      const result = await analyzeQuery(longQuery);

      expect(result.keywordDensity).toBe('high');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });
});
