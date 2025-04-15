import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Demo UI library',
  description: 'A UI library build with tailwind',
  lang: 'zh-CN',
  cleanUrls: true,
  srcDir: './src',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    outline: 'deep',

    nav: [
      { text: 'Home', link: '/' },
      { text: '基于pnpm workspace的monorepo前端工程化', link: '/pnpm-monorepo' },
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: '基于pnpm workspace的monorepo前端工程化', link: '/pnpm-monorepo' },
        ],
      },
    ],

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },
})
