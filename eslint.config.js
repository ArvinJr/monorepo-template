import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  jsx: true,
  javascript: true,
  typescript: true,
  pnpm: true,
  markdown: true,
  rules: {
    'no-console': 'off',
  },
})
