'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TopicNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/topic',
      label: '话题列表',
      description: '按创建时间排序'
    },
    {
      href: '/topicstar',
      label: '热门话题',
      description: '按星标数排序'
    },
    {
      href: '/topic/claude-code',
      label: 'Claude Code',
      description: 'Claude Code 相关项目'
    },
    {
      href: '/topicstar/claude-code',
      label: 'Claude Code 热门',
      description: 'Claude Code 热门项目'
    }
  ]

  const isActiveLink = (href: string) => {
    if (href === '/topic' && pathname === '/topic') return true
    if (href === '/topicstar' && pathname === '/topicstar') return true
    if (href === '/topic/claude-code' && pathname === '/topic/claude-code') return true
    if (href === '/topicstar/claude-code' && pathname === '/topicstar/claude-code') return true
    return false
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              📊 GitHub Topics
            </h1>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={item.description}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <details className="relative">
              <summary className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </summary>
              
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActiveLink(item.href)
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </nav>
  )
}