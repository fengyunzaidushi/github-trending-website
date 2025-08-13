import Head from 'next/head'
import { TrendingRepo } from '@/types/database'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  canonicalUrl?: string
  ogImage?: string
  repos?: TrendingRepo[]
  noindex?: boolean
}

export default function SEOHead({
  title = "GitHub Trending - 实时追踪热门开源项目",
  description = "实时追踪GitHub最热门的开源项目和代码仓库。查看每日、每周、每月的GitHub趋势，按编程语言分类浏览热门项目。",
  keywords = [],
  canonicalUrl,
  ogImage = "/og-image.png",
  repos = [],
  noindex = false
}: SEOHeadProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://github-trending.example.com'
  const fullCanonicalUrl = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl
  
  const defaultKeywords = [
    'github trends',
    'github trending',
    'github trending repositories', 
    'github trending repos',
    'github trendings',
    'github trending history',
    'github trending repo',
    '开源项目',
    '热门仓库',
    '代码趋势',
  ]
  
  const allKeywords = [...defaultKeywords, ...keywords].join(', ')
  
  // 生成页面特定的JSON-LD数据
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": fullCanonicalUrl,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": repos.length,
      "itemListElement": repos.slice(0, 5).map((repo, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SoftwareSourceCode",
          "name": repo.name,
          "description": repo.zh_description || repo.description,
          "url": repo.url,
          "programmingLanguage": repo.language,
          "author": {
            "@type": "Organization",
            "name": repo.owner
          }
        }
      }))
    }
  }

  return (
    <Head>
      {/* 基础SEO标签 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      
      {/* 索引控制 */}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* 规范化URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph标签 */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="GitHub Trending" />
      <meta property="og:locale" content="zh_CN" />
      
      {/* Twitter Card标签 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />
      
      {/* 移动端优化 */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* 主题颜色 */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      
      {/* JSON-LD结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageJsonLd)
        }}
      />
      
      {/* 预加载关键资源 */}
      <link rel="preload" href="/fonts/geist-sans.woff2" as="font" type="font/woff2" crossOrigin="" />
      <link rel="preload" href="/api/trending" as="fetch" crossOrigin="" />
      
      {/* DNS预解析 */}
      <link rel="dns-prefetch" href="//github.com" />
      <link rel="dns-prefetch" href="//avatars.githubusercontent.com" />
    </Head>
  )
}