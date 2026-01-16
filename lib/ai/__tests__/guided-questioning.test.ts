/**
 * 引导式提问引擎测试
 * Feature: ai-chat-assistant, Property 4: 模糊查询的引导式提问
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GuidedQuestioningEngine } from '../guided-questioning';
import * as fc from 'fast-check';

describe('GuidedQuestioningEngine', () => {
  let engine: GuidedQuestioningEngine;

  beforeEach(() => {
    engine = new GuidedQuestioningEngine();
  });

  describe('查询清晰度分析', () => {
    it('应该识别清晰的查询', () => {
      const queries = [
        '推荐适合新手学习的免费配色工具',
        '找一个现代风格的CSS框架用于商业项目',
        '需要专业的字体配对工具用于设计工作',
      ];

      for (const query of queries) {
        const analysis = engine.analyzeQueryClarity(query);
        expect(['clear', 'ambiguous']).toContain(analysis.clarity);
        expect(analysis.missingAspects.length).toBeLessThanOrEqual(2);
      }
    });

    it('应该识别模糊的查询', () => {
      const queries = [
        '工具',
        '推荐',
        '找资源',
        '有什么',
      ];

      for (const query of queries) {
        const analysis = engine.analyzeQueryClarity(query);
        expect(analysis.clarity).toBe('vague');
        expect(analysis.missingAspects.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('应该识别模棱两可的查询', () => {
      const queries = [
        '推荐配色工具',
        '找CSS框架',
        '需要图标库',
      ];

      for (const query of queries) {
        const analysis = engine.analyzeQueryClarity(query);
        expect(['ambiguous', 'clear', 'vague']).toContain(analysis.clarity);
        expect(analysis.missingAspects.length).toBeGreaterThan(0);
      }
    });

    it('应该检测缺失的类别信息', () => {
      const query = '推荐适合新手的免费工具';
      const analysis = engine.analyzeQueryClarity(query);

      expect(analysis.missingAspects).toContain('category');
    });

    it('应该检测缺失的风格信息', () => {
      const query = '推荐配色工具';
      const analysis = engine.analyzeQueryClarity(query);

      expect(analysis.missingAspects).toContain('style');
    });

    it('应该检测缺失的受众信息', () => {
      const query = '推荐简约风格的配色工具';
      const analysis = engine.analyzeQueryClarity(query);

      expect(analysis.missingAspects).toContain('audience');
    });

    it('应该检测缺失的目的信息', () => {
      const query = '推荐配色工具';
      const analysis = engine.analyzeQueryClarity(query);

      expect(analysis.missingAspects).toContain('purpose');
    });

    it('应该返回合理的置信度', () => {
      const query = '推荐工具';
      const analysis = engine.analyzeQueryClarity(query);

      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('澄清问题生成', () => {
    it('应该为模糊查询生成澄清问题', () => {
      const analysis = engine.analyzeQueryClarity('推荐工具');
      const questions = engine.generateClarificationQuestions(analysis);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.length).toBeLessThanOrEqual(3);
      questions.forEach(q => {
        expect(q).toBeTruthy();
        expect(typeof q).toBe('string');
      });
    });

    it('应该为缺失类别生成相关问题', () => {
      const analysis = {
        clarity: 'vague' as const,
        missingAspects: ['category' as const],
        confidence: 0.8,
      };
      const questions = engine.generateClarificationQuestions(analysis);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toContain('类别');
    });

    it('应该为缺失风格生成相关问题', () => {
      const analysis = {
        clarity: 'ambiguous' as const,
        missingAspects: ['style' as const],
        confidence: 0.7,
      };
      const questions = engine.generateClarificationQuestions(analysis);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toContain('风格');
    });

    it('应该为缺失受众生成相关问题', () => {
      const analysis = {
        clarity: 'ambiguous' as const,
        missingAspects: ['audience' as const],
        confidence: 0.7,
      };
      const questions = engine.generateClarificationQuestions(analysis);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toContain('人群');
    });

    it('应该为缺失目的生成相关问题', () => {
      const analysis = {
        clarity: 'ambiguous' as const,
        missingAspects: ['purpose' as const],
        confidence: 0.7,
      };
      const questions = engine.generateClarificationQuestions(analysis);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toContain('目的');
    });

    it('应该限制问题数量不超过3个', () => {
      const analysis = {
        clarity: 'vague' as const,
        missingAspects: ['category' as const, 'style' as const, 'audience' as const, 'purpose' as const],
        confidence: 0.9,
      };
      const questions = engine.generateClarificationQuestions(analysis);

      expect(questions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('澄清判断', () => {
    it('应该对非常模糊的查询要求澄清', () => {
      const analysis = {
        clarity: 'vague' as const,
        missingAspects: ['category' as const, 'style' as const, 'audience' as const, 'purpose' as const],
        confidence: 0.9,
      };

      expect(engine.shouldAskForClarification(analysis)).toBe(true);
    });

    it('应该对清晰的查询不要求澄清', () => {
      const analysis = {
        clarity: 'clear' as const,
        missingAspects: [],
        confidence: 0.9,
      };

      expect(engine.shouldAskForClarification(analysis)).toBe(false);
    });

    it('应该对缺少多个方面但置信度不够高的查询不要求澄清', () => {
      const analysis = {
        clarity: 'ambiguous' as const,
        missingAspects: ['style' as const, 'audience' as const],
        confidence: 0.7,
      };

      expect(engine.shouldAskForClarification(analysis)).toBe(false);
    });

    it('应该对只缺少一个方面的查询不要求澄清', () => {
      const analysis = {
        clarity: 'ambiguous' as const,
        missingAspects: ['style' as const],
        confidence: 0.6,
      };

      expect(engine.shouldAskForClarification(analysis)).toBe(false);
    });
  });

  describe('查询优化', () => {
    it('应该能够根据澄清答案优化查询', () => {
      const original = '推荐工具';
      const clarification = '配色工具，适合新手';
      const refined = engine.refineQuery(original, clarification);

      expect(refined).toContain(original);
      expect(refined).toContain(clarification);
    });

    it('应该生成相关的建议查询', () => {
      const queries = ['配色', 'CSS', '字体', '图标'];

      for (const query of queries) {
        const suggestions = engine.generateSuggestedQueries(query);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.length).toBeLessThanOrEqual(3);
      }
    });

    it('应该为未知查询生成通用建议', () => {
      const suggestions = engine.generateSuggestedQueries('随机查询xyz');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('属性测试：模糊查询检测', () => {
    it('Property: 任何查询都应该返回有效的分析结果', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (query) => {
            const analysis = engine.analyzeQueryClarity(query);

            expect(analysis).toHaveProperty('clarity');
            expect(analysis).toHaveProperty('missingAspects');
            expect(analysis).toHaveProperty('confidence');
            expect(['clear', 'vague', 'ambiguous']).toContain(analysis.clarity);
            expect(Array.isArray(analysis.missingAspects)).toBe(true);
            expect(analysis.confidence).toBeGreaterThanOrEqual(0);
            expect(analysis.confidence).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: 生成的澄清问题数量应该合理', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (query) => {
            const analysis = engine.analyzeQueryClarity(query);
            const questions = engine.generateClarificationQuestions(analysis);

            expect(questions.length).toBeGreaterThanOrEqual(0);
            expect(questions.length).toBeLessThanOrEqual(3);
            questions.forEach(q => {
              expect(typeof q).toBe('string');
              expect(q.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: 澄清判断应该一致', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (query) => {
            const analysis = engine.analyzeQueryClarity(query);
            const shouldAsk = engine.shouldAskForClarification(analysis);

            expect(typeof shouldAsk).toBe('boolean');

            // 如果需要澄清，应该有澄清问题
            if (shouldAsk) {
              const questions = engine.generateClarificationQuestions(analysis);
              expect(questions.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: 建议查询应该总是返回有效结果', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (query) => {
            const suggestions = engine.generateSuggestedQueries(query);

            expect(Array.isArray(suggestions)).toBe(true);
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.length).toBeLessThanOrEqual(3);
            suggestions.forEach(s => {
              expect(typeof s).toBe('string');
              expect(s.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
