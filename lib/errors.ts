/**
 * 应用错误类型定义
 *
 * 提供统一的错误处理机制，包括：
 * - 基础应用错误类
 * - 认证错误
 * - 授权错误
 * - 验证错误
 * - 资源不存在错误
 * - 冲突错误
 */

/**
 * 基础应用错误类
 * 所有自定义错误都应继承此类
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';

    // 维护正确的堆栈跟踪（仅在 V8 引擎中可用）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 认证错误 (401)
 * 用户未登录或会话已过期
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * 授权错误 (403)
 * 用户已登录但权限不足
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * 验证错误 (400)
 * 请求数据不符合验证规则
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * 资源不存在错误 (404)
 * 请求的资源未找到
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * 冲突错误 (409)
 * 资源已存在或操作冲突
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * 内部服务器错误 (500)
 * 未预期的服务器错误
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR');
    this.name = 'InternalServerError';
  }
}

/**
 * 错误响应接口
 * API 返回的标准错误格式
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

/**
 * 判断是否为应用错误
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 从错误对象提取状态码
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

/**
 * 从错误对象提取错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * 从错误对象提取错误代码
 */
export function getErrorCode(error: unknown): string {
  if (isAppError(error) && error.code) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}
