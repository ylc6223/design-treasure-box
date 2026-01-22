/**
 * 查询分析器 (Query Analyzer)
 *
 * 实现意图识别、维度提取、置信度计算
 * 基于 technical-specification.md 1.1 节设计
 */

// ============ 类型定义 ============

/**
 * 搜索维度
 */
export interface SearchDimensions {
  industry?: string;
  style?: string;
  type?: string;
  color?: string;
}

/**
 * 关键词密度等级
 */
export type DensityLevel = 'low' | 'medium' | 'high';

/**
 * 清晰度等级
 */
export type ClarityLevel = 'clear' | 'ambiguous' | 'vague';

/**
 * 意图类型
 */
export type IntentType = 'search' | 'inspiration' | 'correction' | 'blocked';

/**
 * 查询分析结果
 */
export interface QueryAnalysis {
  intent: IntentType;
  confidence: number; // 0-1
  dimensions: SearchDimensions;
  clarity: ClarityLevel;
  requiresClarification: boolean;
  keywordDensity: DensityLevel;
  extractedKeywords: string[];
}

// ============ 关键词库 ============

/**
 * 停用词列表（中文）
 */
const STOP_WORDS = new Set([
  '的',
  '了',
  '是',
  '在',
  '我',
  '有',
  '和',
  '就',
  '不',
  '人',
  '都',
  '一',
  '一个',
  '上',
  '也',
  '很',
  '到',
  '说',
  '要',
  '去',
  '你',
  '会',
  '着',
  '没有',
  '看',
  '好',
  '自己',
  '这',
  '那',
  '里',
  '为',
  '么',
  '什么',
  '怎么',
  '给',
  '找',
  '想',
  '能',
  '可以',
  '帮',
  '帮我',
  '请',
  '推荐',
  '一些',
  '几个',
]);

/**
 * 行业关键词库
 */
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  医疗: ['医疗', '医院', '健康', '医药', '诊所', '医生', '护理'],
  金融: ['金融', '银行', '保险', '理财', '投资', '证券', '基金'],
  教育: ['教育', '学校', '培训', '课程', '学习', '在线教育'],
  电商: ['电商', '购物', '商城', '零售', '店铺', '淘宝', '京东'],
  SaaS: ['SaaS', '企业', '办公', 'B2B', '管理系统', 'CRM', 'ERP'],
  科技: ['科技', '技术', 'AI', '人工智能', '大数据', '云计算'],
  游戏: ['游戏', 'Game', '电竞', '娱乐'],
  社交: ['社交', '社区', '聊天', '即时通讯'],
  餐饮: ['餐饮', '美食', '外卖', '餐厅', '食品'],
  旅游: ['旅游', '酒店', '出行', '景点', '机票'],
};

/**
 * 风格关键词库
 */
const STYLE_KEYWORDS: Record<string, string[]> = {
  极简: ['极简', '简约', '简洁', 'minimal', 'minimalist', '留白'],
  '3D': ['3D', '立体', '三维', '渲染'],
  扁平: ['扁平', 'flat', '平面'],
  手绘: ['手绘', '插画', '手写', '涂鸦'],
  渐变: ['渐变', 'gradient', '彩虹'],
  玻璃拟态: ['玻璃', 'glass', 'glassmorphism', '毛玻璃'],
  新拟态: ['新拟态', 'neumorphism', '软UI'],
  暗黑: ['暗黑', 'dark', '深色', '黑暗模式'],
  明亮: ['明亮', 'light', '浅色', '白色'],
  复古: ['复古', 'retro', '怀旧', '经典'],
  现代: ['现代', 'modern', '时尚', '潮流'],
  科技感: ['科技感', 'tech', '未来', '赛博朋克'],
};

/**
 * 类型关键词库
 */
const TYPE_KEYWORDS: Record<string, string[]> = {
  网站: ['网站', '官网', '主页', 'website', 'web'],
  图标: ['图标', 'icon', 'icons', '图标集'],
  APP: ['APP', '应用', '移动端', 'mobile', '手机'],
  后台: ['后台', '管理', 'admin', 'dashboard', '仪表盘'],
  落地页: ['落地页', 'landing', 'landing page', '着陆页'],
  插画: ['插画', 'illustration', '绘画'],
  UI套件: ['UI套件', 'UI kit', '组件库', '设计系统'],
};

/**
 * 颜色关键词库
 */
const COLOR_KEYWORDS: Record<string, string[]> = {
  红色: ['红色', '红', 'red', '朱红', '玫红'],
  蓝色: ['蓝色', '蓝', 'blue', '天蓝', '深蓝', '海蓝'],
  绿色: ['绿色', '绿', 'green', '翠绿', '草绿'],
  黄色: ['黄色', '黄', 'yellow', '金色', '橙黄'],
  紫色: ['紫色', '紫', 'purple', '紫罗兰'],
  橙色: ['橙色', '橙', 'orange'],
  黑色: ['黑色', '黑', 'black'],
  白色: ['白色', '白', 'white'],
  粉色: ['粉色', '粉', 'pink', '粉红'],
  灰色: ['灰色', '灰', 'gray', 'grey'],
};

/**
 * 纠正意图关键词
 */
const CORRECTION_PATTERNS = [
  /^不是/,
  /^不要/,
  /^不对/,
  /^换个/,
  /^换一/,
  /^重新/,
  /^别/,
  /^除了/,
  /^排除/,
  /^不包括/,
  /不是这个/,
  /不喜欢/,
  /换成/,
  /改成/,
];

/**
 * 探索意图关键词
 */
const INSPIRATION_PATTERNS = [
  /灵感/,
  /推荐/,
  /看看/,
  /有什么/,
  /有哪些/,
  /随便/,
  /都行/,
  /热门/,
  /流行/,
  /最新/,
  /好的/,
  /优秀/,
  /精品/,
  /经典/,
];

// ============ 核心函数 ============

/**
 * 分析用户查询
 *
 * @param query - 用户输入的查询文本
 * @param sessionContext - 会话上下文（历史偏好）
 * @returns 查询分析结果
 */
export async function analyzeQuery(
  query: string,
  sessionContext: SearchDimensions = {}
): Promise<QueryAnalysis> {
  // 标准化查询
  const normalizedQuery = query.trim().toLowerCase();

  // 1. 提取有效关键词
  const extractedKeywords = extractKeywords(normalizedQuery);

  // 2. 关键词密度分析
  const keywordDensity = calculateKeywordDensity(extractedKeywords);

  // 3. 维度提取（行业、风格、类型、颜色）
  const dimensions = extractDimensions(normalizedQuery, sessionContext);

  // 4. 置信度计算
  const confidence = calculateConfidence(keywordDensity, dimensions);

  // 5. 澄清决策
  const requiresClarification =
    confidence < 0.7 || (keywordDensity === 'low' && Object.keys(dimensions).length < 2);

  // 6. 意图分类
  const intent = classifyIntent(query, sessionContext);

  // 7. 清晰度判定
  const clarity: ClarityLevel =
    confidence > 0.8 ? 'clear' : confidence > 0.5 ? 'ambiguous' : 'vague';

  return {
    intent,
    confidence,
    dimensions,
    clarity,
    requiresClarification,
    keywordDensity,
    extractedKeywords,
  };
}

/**
 * 提取有效关键词（过滤停用词）
 * 支持中英文混合分词
 */
export function extractKeywords(query: string): string[] {
  // 1. 先按空格和标点分割
  const segments = query
    .replace(/[,，.。!！?？:：;；、]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // 2. 对每个segment进行中文分词（简单按照关键词库匹配）
  const allKeywords: string[] = [];

  // 收集所有关键词
  const allKnownKeywords = [
    ...Object.values(INDUSTRY_KEYWORDS).flat(),
    ...Object.values(STYLE_KEYWORDS).flat(),
    ...Object.values(TYPE_KEYWORDS).flat(),
    ...Object.values(COLOR_KEYWORDS).flat(),
  ];

  // 按长度降序排列，优先匹配长词
  const sortedKeywords = allKnownKeywords.sort((a, b) => b.length - a.length);

  for (const segment of segments) {
    // 如果是纯英文，直接添加
    if (/^[a-zA-Z0-9]+$/.test(segment)) {
      allKeywords.push(segment);
      continue;
    }

    // 中文分词：尝试匹配关键词库中的词
    let remaining = segment;
    const matched: string[] = [];

    for (const kw of sortedKeywords) {
      if (remaining.toLowerCase().includes(kw.toLowerCase())) {
        matched.push(kw);
        remaining = remaining.toLowerCase().replace(kw.toLowerCase(), ' ');
      }
    }

    // 添加匹配到的关键词
    allKeywords.push(...matched);

    // 如果没有匹配到任何关键词，保留原segment
    if (matched.length === 0 && segment.length > 0) {
      allKeywords.push(segment);
    }
  }

  // 3. 过滤停用词
  const keywords = allKeywords.filter((word) => !STOP_WORDS.has(word));

  return keywords;
}

/**
 * 计算关键词密度
 */
export function calculateKeywordDensity(keywords: string[]): DensityLevel {
  const count = keywords.length;

  if (count >= 4) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
}

/**
 * 提取搜索维度
 */
export function extractDimensions(query: string, context: SearchDimensions = {}): SearchDimensions {
  const dimensions: SearchDimensions = { ...context };

  // 提取行业
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some((kw) => query.includes(kw.toLowerCase()))) {
      dimensions.industry = industry;
      break;
    }
  }

  // 提取风格
  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
    if (keywords.some((kw) => query.includes(kw.toLowerCase()))) {
      dimensions.style = style;
      break;
    }
  }

  // 提取类型
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((kw) => query.includes(kw.toLowerCase()))) {
      dimensions.type = type;
      break;
    }
  }

  // 提取颜色
  for (const [color, keywords] of Object.entries(COLOR_KEYWORDS)) {
    if (keywords.some((kw) => query.includes(kw.toLowerCase()))) {
      dimensions.color = color;
      break;
    }
  }

  return dimensions;
}

/**
 * 计算置信度
 * 基于关键词密度和维度数量
 */
export function calculateConfidence(density: DensityLevel, dimensions: SearchDimensions): number {
  // 密度基础分
  const densityScore = density === 'high' ? 0.6 : density === 'medium' ? 0.4 : 0.2;

  // 维度加成（每个维度 +0.15，最大 0.6）
  const dimensionCount = Object.values(dimensions).filter(Boolean).length;
  const dimensionScore = Math.min(dimensionCount * 0.15, 0.6);

  // 总分（0-1）
  return Math.min(1, densityScore + dimensionScore);
}

/**
 * 分类用户意图
 */
export function classifyIntent(query: string, _context: SearchDimensions): IntentType {
  const normalizedQuery = query.trim();

  // 空查询 → blocked
  if (normalizedQuery.length === 0) {
    return 'blocked';
  }

  // 检测纠正意图
  if (CORRECTION_PATTERNS.some((pattern) => pattern.test(normalizedQuery))) {
    return 'correction';
  }

  // 检测探索意图
  if (INSPIRATION_PATTERNS.some((pattern) => pattern.test(normalizedQuery))) {
    return 'inspiration';
  }

  // 默认：搜索意图
  return 'search';
}

/**
 * 获取缺失的维度（用于澄清问题生成）
 */
export function getMissingDimensions(dimensions: SearchDimensions): string[] {
  const missing: string[] = [];

  if (!dimensions.industry) missing.push('industry');
  if (!dimensions.style) missing.push('style');
  if (!dimensions.type) missing.push('type');
  // 颜色是可选的，不作为缺失维度

  return missing;
}

/**
 * 格式化分析结果用于日志
 */
export function formatAnalysisForLog(analysis: QueryAnalysis): string {
  return `
Intent: ${analysis.intent}
Confidence: ${(analysis.confidence * 100).toFixed(1)}%
Clarity: ${analysis.clarity}
Density: ${analysis.keywordDensity}
Dimensions: ${JSON.stringify(analysis.dimensions)}
Keywords: [${analysis.extractedKeywords.join(', ')}]
Needs Clarification: ${analysis.requiresClarification}
  `.trim();
}
