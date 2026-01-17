'use client'

/**
 * Header 使用示例
 * 
 * 展示如何使用 Header 组件
 */

import { Header } from './header'
import { useState } from 'react'
import { useCategories } from '@/hooks/use-categories'

/**
 * 基础示例：带分类切换的 Header
 */
export function BasicHeaderExample() {
  const { data: categories = [] } = useCategories()
  const [activeCategory, setActiveCategory] = useState<string>('')

  return (
    <Header
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
    />
  )
}

/**
 * 受控示例：从 URL 参数读取激活分类
 */
export function ControlledHeaderExample() {
  const [activeCategory, setActiveCategory] = useState<string>('')

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
    
    // 更新 URL（实际项目中使用 Next.js router）
    if (categoryId) {
      window.history.pushState({}, '', `/category/${categoryId}`)
    } else {
      window.history.pushState({}, '', '/')
    }
  }

  return (
    <Header
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={handleCategoryChange}
    />
  )
}

/**
 * 简单示例：不带分类切换回调
 */
export function SimpleHeaderExample() {
  return <Header categories={categories} />
}

/**
 * 自定义样式示例
 */
export function CustomStyledHeaderExample() {
  const [activeCategory, setActiveCategory] = useState<string>('')

  return (
    <Header
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      className="border-b-2"
    />
  )
}
