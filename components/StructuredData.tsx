import Script from 'next/script'
import { TrendingRepo } from '@/types/database'

interface JsonLdProps {
  repos: TrendingRepo[]
  date: string
  category: string
  period: string
}

export default function StructuredData({ repos, date, category, period }: JsonLdProps) {
  const periodText = {
    daily: '日榜',
    weekly: '周榜', 
    monthly: '月榜'
  }[period] || '日榜';
  
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GitHub Trending",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com",
    "description": "实时追踪GitHub最热门的开源项目和代码仓库",
    "inLanguage": "zh-CN",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com"}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GitHub Trending Dashboard",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com",
    "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com"}/logo.png`,
    "description": "专业的GitHub趋势追踪和开源项目发现平台"
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `GitHub Trending ${periodText} - ${category === 'all' ? '全部语言' : category} (${date})`,
    "description": `查看${date}的GitHub ${periodText}热门开源项目`,
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com"}/?date=${date}&category=${category}&period=${period}`,
    "inLanguage": "zh-CN",
    "datePublished": date,
    "dateModified": new Date().toISOString(),
    "isPartOf": {
      "@type": "WebSite",
      "name": "GitHub Trending",
      "url": process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com"
    }
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `GitHub ${periodText}热门项目排行榜`,
    "description": `${date} GitHub ${periodText}最热门的开源项目列表`,
    "numberOfItems": repos.length,
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "itemListElement": repos.slice(0, 10).map((repo, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareSourceCode",
        "name": repo.name,
        "description": repo.zh_description || repo.description,
        "url": repo.url,
        "programmingLanguage": repo.language,
        "codeRepository": repo.url,
        "author": {
          "@type": "Organization", 
          "name": repo.owner,
          "url": `https://github.com/${repo.owner}`
        },
        "interactionStatistic": [
          {
            "@type": "InteractionCounter",
            "interactionType": "https://schema.org/LikeAction",
            "userInteractionCount": repo.stars
          },
          {
            "@type": "InteractionCounter", 
            "interactionType": "https://schema.org/ShareAction",
            "userInteractionCount": repo.forks
          }
        ]
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首页",
        "item": process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `GitHub ${periodText}`,
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com"}/?period=${period}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": category === 'all' ? '全部语言' : category,
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://github-trending.example.com"}/?category=${category}&period=${period}`
      }
    ]
  };

  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="webpage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema),
        }}
      />
      <Script
        id="itemlist-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListSchema),
        }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}