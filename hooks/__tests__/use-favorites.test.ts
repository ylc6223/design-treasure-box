import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '../use-favorites'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useFavorites', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should initialize with empty favorites', () => {
    const { result } = renderHook(() => useFavorites())
    
    expect(result.current.favorites).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('should add a favorite', () => {
    const { result } = renderHook(() => useFavorites())
    
    act(() => {
      result.current.addFavorite('resource-1')
    })
    
    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].resourceId).toBe('resource-1')
    expect(result.current.isFavorited('resource-1')).toBe(true)
  })

  it('should not add duplicate favorites', () => {
    const { result } = renderHook(() => useFavorites())
    
    act(() => {
      result.current.addFavorite('resource-1')
      result.current.addFavorite('resource-1')
    })
    
    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].resourceId).toBe('resource-1')
  })

  it('should remove a favorite', () => {
    const { result } = renderHook(() => useFavorites())
    
    act(() => {
      result.current.addFavorite('resource-1')
      result.current.addFavorite('resource-2')
    })
    
    expect(result.current.favorites).toHaveLength(2)
    
    act(() => {
      result.current.removeFavorite('resource-1')
    })
    
    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].resourceId).toBe('resource-2')
    expect(result.current.isFavorited('resource-1')).toBe(false)
  })

  it('should check if resource is favorited', () => {
    const { result } = renderHook(() => useFavorites())
    
    expect(result.current.isFavorited('resource-1')).toBe(false)
    
    act(() => {
      result.current.addFavorite('resource-1')
    })
    
    expect(result.current.isFavorited('resource-1')).toBe(true)
  })

  it('should clear all favorites', () => {
    const { result } = renderHook(() => useFavorites())
    
    act(() => {
      result.current.addFavorite('resource-1')
      result.current.addFavorite('resource-2')
      result.current.addFavorite('resource-3')
    })
    
    expect(result.current.favorites).toHaveLength(3)
    
    act(() => {
      result.current.clearFavorites()
    })
    
    expect(result.current.favorites).toEqual([])
  })

  it('should persist favorites to localStorage', () => {
    const { result } = renderHook(() => useFavorites())
    
    act(() => {
      result.current.addFavorite('resource-1')
    })
    
    const stored = localStorageMock.getItem('design-treasure-box-favorites')
    expect(stored).toBeTruthy()
    
    const data = JSON.parse(stored!)
    expect(data.items).toHaveLength(1)
    expect(data.items[0].resourceId).toBe('resource-1')
  })

  it('should load favorites from localStorage on mount', () => {
    // Pre-populate localStorage
    const storedData = {
      version: 1,
      items: [
        { resourceId: 'resource-1', addedAt: '2024-01-01T00:00:00.000Z' },
        { resourceId: 'resource-2', addedAt: '2024-01-02T00:00:00.000Z' },
      ],
      lastUpdated: '2024-01-02T00:00:00.000Z',
    }
    localStorageMock.setItem('design-treasure-box-favorites', JSON.stringify(storedData))
    
    const { result } = renderHook(() => useFavorites())
    
    expect(result.current.favorites).toHaveLength(2)
    expect(result.current.favorites[0].resourceId).toBe('resource-1')
    expect(result.current.favorites[1].resourceId).toBe('resource-2')
  })
})
