/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
}

// 注释掉 Cloudflare 开发环境初始化以避免 ESM 警告
// 在部署时这个功能不是必需的，开发时也可以正常工作
/*
if (process.env.NODE_ENV === 'development') {
  try {
    const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare')
    initOpenNextCloudflareForDev()
  } catch (error) {
    console.warn('Failed to initialize OpenNext Cloudflare for dev:', error)
  }
}
*/

module.exports = nextConfig