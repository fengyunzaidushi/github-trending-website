import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GitHub Trending - 实时追踪热门开源项目",
    template: "%s | GitHub Trending"
  },
  description: "实时追踪GitHub最热门的开源项目和代码仓库。查看每日、每周、每月的GitHub趋势，按编程语言分类浏览热门项目，发现最新的开源技术和工具。",
  keywords: [
    "github trends",
    "github trending",
    "github trending repositories", 
    "github trending repos",
    "github trendings",
    "github trending history",
    "github trending repo",
    "开源项目",
    "热门仓库",
    "代码趋势",
    "编程语言",
    "开源软件",
    "GitHub排行榜",
    "项目发现",
    "代码库",
    "开发工具"
  ],
  authors: [{ name: "GitHub Trending Dashboard" }],
  creator: "GitHub Trending Dashboard",
  publisher: "GitHub Trending Dashboard",
  robots: "index, follow",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "GitHub Trending",
    title: "GitHub Trending - 实时追踪热门开源项目",
    description: "实时追踪GitHub最热门的开源项目和代码仓库。查看每日、每周、每月的GitHub趋势，按编程语言分类浏览热门项目。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GitHub Trending Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Trending - 实时追踪热门开源项目",
    description: "实时追踪GitHub最热门的开源项目和代码仓库。查看每日、每周、每月的GitHub趋势。",
    images: ["/og-image.png"],
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "technology",
  classification: "Business",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}