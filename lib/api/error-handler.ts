/**
 * API 错误处理中间件
 *
 * 提供统一的错误处理机制，包括：
 * - Zod 验证错误处理
 * - Supabase 错误处理
 * - 应用自定义错误处理
 * - 未知错误处理
 * - 标准化错误响应格式
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, type ErrorResponse } from '@/lib/errors';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * 处理 API 错误并返回标准化的响应
 *
 * @param error - 错误对象
 * @returns NextResponse 包含错误信息的响应
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // 开发环境下打印完整错误信息
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }

  // Zod 验证错误
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // 应用自定义错误
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code || 'APP_ERROR',
      },
      { status: error.statusCode }
    );
  }

  // Supabase PostgrestError
  if (isPostgrestError(error)) {
    return handleSupabaseError(error);
  }

  // 标准 Error 对象
  if (error instanceof Error) {
    // 生产环境不暴露详细错误信息
    const message =
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        error: message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  // 未知错误
  return NextResponse.json(
    {
      error: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * 处理 Supabase 错误
 */
function handleSupabaseError(error: PostgrestError): NextResponse<ErrorResponse> {
  // 唯一约束冲突
  if (error.code === '23505') {
    return NextResponse.json(
      {
        error: 'Resource already exists',
        code: 'CONFLICT',
        details: error.details,
      },
      { status: 409 }
    );
  }

  // 外键约束冲突
  if (error.code === '23503') {
    return NextResponse.json(
      {
        error: 'Referenced resource not found',
        code: 'NOT_FOUND',
        details: error.details,
      },
      { status: 404 }
    );
  }

  // 检查约束冲突
  if (error.code === '23514') {
    return NextResponse.json(
      {
        error: 'Data validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details,
      },
      { status: 400 }
    );
  }

  // 权限错误
  if (error.code === '42501') {
    return NextResponse.json(
      {
        error: 'Insufficient permissions',
        code: 'AUTHORIZATION_ERROR',
        details: error.details,
      },
      { status: 403 }
    );
  }

  // 其他 Supabase 错误
  const message =
    process.env.NODE_ENV === 'development' ? error.message : 'Database operation failed';

  return NextResponse.json(
    {
      error: message,
      code: 'DATABASE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    },
    { status: 500 }
  );
}

/**
 * 类型守卫：判断是否为 PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * API 路由包装器
 * 自动捕获错误并使用 handleApiError 处理
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   // 你的 API 逻辑
 *   return NextResponse.json({ data: 'success' })
 * })
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * 验证请求体
 * 使用 Zod schema 验证并在失败时抛出 ValidationError
 *
 * @example
 * const data = await validateRequestBody(request, CreateResourceSchema)
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new Error('Invalid request body');
  }
}

/**
 * 成功响应辅助函数
 */
export function successResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * 创建响应辅助函数
 */
export function createdResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

/**
 * 无内容响应辅助函数
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
