import type { Metadata } from "next";
import { Suspense } from "react";
import HomeClient from "./home-client";

interface PageProps {
  searchParams: Promise<{ 
    date?: string;
    category?: string;
    period?: string;
    q?: string;
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const date = params.date || new Date().toISOString().split('T')[0];
  const category = params.category || 'all';
  const period = params.period || 'daily';
  const query = params.q;
  
  const periodText = {
    daily: '日榜',
    weekly: '周榜', 
    monthly: '月榜'
  }[period] || '日榜';
  
  const categoryText = category === 'all' ? '全部语言' : category;
  
  // 如果是搜索页面
  if (query) {
    const title = `搜索"${query}" - GitHub Trending`;
    const description = `在GitHub trending repositories中搜索"${query}"相关的热门开源项目。发现最新的代码库和开发工具。`;
    
    return {
      title,
      description,
      keywords: [
        `github trending ${query}`,
        `${query} github repositories`,
        'github trending search',
        'github trends',
        'github trending repos',
        '开源项目搜索',
        `${query} 开源代码`,
      ],
      openGraph: {
        title,
        description,
        url: `/?q=${encodeURIComponent(query)}`,
      },
      twitter: {
        title,
        description,
      },
      robots: 'index, follow',
      alternates: {
        canonical: `/?q=${encodeURIComponent(query)}`
      }
    };
  }
  
  // 常规页面
  const title = `GitHub Trending ${periodText} - ${categoryText} (${date})`;
  const description = `查看${date}的GitHub ${periodText}热门开源项目。包含${categoryText}的最新趋势仓库，实时更新GitHub trending repositories排行榜。发现最热门的开源代码和项目。`;

  return {
    title,
    description,
    keywords: [
      `github trending ${date}`,
      `github trends ${period}`,
      `${category} github trending`,
      'github trending repositories',
      'github trending repos',
      'github trendings',
      'github trending history',
      'github trending repo',
      'open source projects',
      '开源项目排行榜',
      `${date} 热门代码`,
      `GitHub ${periodText}`,
      `${categoryText} 项目`,
      '代码趋势分析',
      '开发者工具',
      '编程语言排行',
    ],
    openGraph: {
      title,
      description,
      url: `/?date=${date}&category=${category}&period=${period}`,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `GitHub Trending ${periodText} - ${categoryText}`,
        },
      ],
      locale: 'zh_CN',
      siteName: 'GitHub Trending',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    robots: 'index, follow',
    alternates: {
      canonical: `/?date=${date}&category=${category}&period=${period}`
    }
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  return (
    <>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        <HomeClient searchParams={params} />
      </Suspense>
    </>
  );
}