import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/supabase/auth';
import { UpdateResourceSchema } from '@/types/resource';

/**
 * GET /api/admin/resources/[id]
 * 获取单个资源详情
 * 需要管理员权限
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    await requireAdmin();
    const supabase = await createClient();

    const { id } = await params;

    // 查询资源
    const { data: resource, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Resource not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      console.error('Failed to fetch resource:', error);
      return NextResponse.json(
        { error: 'Failed to fetch resource', code: 'FETCH_ERROR', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(resource);
  } catch (error: any) {
    console.error('Admin resource GET error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/resources/[id]
 * 更新资源
 * 需要管理员权限
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证管理员权限
    await requireAdmin();
    const supabase = await createClient();

    const { id } = await params;

    // 解析请求体
    const body = await request.json();

    // 验证数据
    const validationResult = UpdateResourceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 构建更新对象（只包含提供的字段）
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.curatorNote !== undefined) updateData.curator_note = data.curatorNote;
    if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured;
    if (data.curatorRating !== undefined) updateData.curator_rating = data.curatorRating;

    // 如果没有要更新的字段
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    // 更新资源
    const { data: resource, error } = await (supabase as any)
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Resource not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      console.error('Failed to update resource:', error);
      return NextResponse.json(
        { error: 'Failed to update resource', code: 'UPDATE_ERROR', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(resource);
  } catch (error: any) {
    console.error('Admin resource PUT error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/resources/[id]
 * 删除资源（会级联删除相关评分）
 * 需要管理员权限
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    await requireAdmin();
    const supabase = await createClient();

    const { id } = await params;

    // 删除资源（RLS 会自动级联删除评分）
    const { error } = await supabase.from('resources').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete resource:', error);
      return NextResponse.json(
        { error: 'Failed to delete resource', code: 'DELETE_ERROR', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Resource deleted successfully' });
  } catch (error: any) {
    console.error('Admin resource DELETE error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
