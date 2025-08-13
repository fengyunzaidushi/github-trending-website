import type { Metadata } from "next";

interface GenerateMetadataProps {
  searchParams: { 
    date?: string;
    category?: string;
    period?: string;
  }
}

export async function generateMetadata({ searchParams }: GenerateMetadataProps): Promise<Metadata> {
  const date = searchParams.date || new Date().toISOString().split('T')[0];
  const category = searchParams.category || 'all';
  const period = searchParams.period || 'daily';
  
  const periodText = {
    daily: '日榜',
    weekly: '周榜', 
    monthly: '月榜'
  }[period] || '日榜';
  
  const categoryText = category === 'all' ? '全部语言' : category;
  
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
      'open source projects',
      '开源项目排行榜',
      `${date} 热门代码`,
      `GitHub ${periodText}`,
    ],
    openGraph: {
      title,
      description,
      url: `/?date=${date}&category=${category}&period=${period}`,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `GitHub Trending ${periodText} - ${categoryText}`,
        },
      ],
    },
    twitter: {
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `/?date=${date}&category=${category}&period=${period}`
    }
  };
}