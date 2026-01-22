'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useScrollVisibility Hook
 *
 * 监听页面滚动，在滚动时隐藏元素，停止滚动后延迟显示
 * 用于 AI Prompt 输入框的滚动隐藏/显示效果
 *
 * @param hideDelay - 滚动停止后延迟显示的时间（毫秒），默认 300ms
 * @returns isVisible - 元素是否可见
 */
export function useScrollVisibility(hideDelay = 300) {
  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrolling = currentScrollY !== lastScrollY.current;
      lastScrollY.current = currentScrollY;

      if (isScrolling) {
        // 滚动中，隐藏元素
        setIsVisible(false);

        // 清除之前的定时器
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // 滚动停止后延迟显示
        scrollTimeoutRef.current = setTimeout(() => {
          setIsVisible(true);
        }, hideDelay);
      }
    };

    // 使用 passive 选项优化性能
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [hideDelay]);

  return isVisible;
}
