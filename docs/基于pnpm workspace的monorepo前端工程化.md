# 1. 简介

当前前端项目主要有以下 3 种代码管理方案：

1. UI 库、调试库、生产库、\[ 后端库 \] 都是单独开一个仓库管理和开发
    1. 缺点：开发者需要开多个 IDE 窗口进行项目的管理，开发状态较为混乱，容易出现开发完成后忘记提交的问题；UI
       库中容易出现管理不善出现部分调试用代码
    2. 优点：在开发团队强大是方便进行责任的分发和管理
2. UI 库作为调试库和生产库的 git 子模块被引入进调试库和生产库
    1. 缺点：在上一个的基础上容易出现在父级项目中更新 git 子模块版本不及时的问题
    2. 优点：UI 库以子文件夹的方式存在，在需要紧急调整 UI 库的时候可以直接在父级项目中对目标内容进行更改；但这样也会导致无法把改动同步回
       UI 库需手动在 UI 库中进行更改后再单独提交
3. 使用基于 `pnpm workspace`、`Yarn Plug'n'Play` 等解决方案所搭建的 `monorepo` 项目将基于 `Nodejs` 生态进行统一开发和管理
    1. 缺点：所有人都在一个仓库中开发，在人数较多的开发团队中容易出现 git 仓库管理混乱的问题；尤其是在后端也使用 `Nodejs`
       进行开发的时候
    2. 优点：随时可以使用调试库的热加载功能进行调试，可以将调试内容与组件库完全隔离；在生产库不用担心无法及时更新组件库相关依赖；在工作区中同时有后端的时候更便于联调

# 2. 解决方案

当前主流的 `monorepo` 解决方案主要有两个 `pnpm workspace`、`Yarn Plug'n'Play` 分别基于 `pnpm` 和 `yarn`，当然基于 `npm`
也可以直接在 `packsge.json` 中编写 workspace 相关配置但相对比较麻烦且与其他配置过于耦合故通常不在考虑范围内。

`pnpm` 和 `yarn` 该如何选择呢？基于当前版本（`yarn: 4.7.0` `pnpm: 9.4.0`）下两者的优缺点：

| 平台     | 依赖管理                                                                  | 工作区管理                                  |
|--------|-----------------------------------------------------------------------|----------------------------------------|
| `yarn` | 通过 `Nodejs` 加载器文件 `.pnp.cjs` 将缓存文件夹下的目标依赖复制到当前项目的 `node_modules` 文件夹  | 与 `packages.json` 耦合使用 `workspace` 关键字 |
| `pnpm` | 在安装时检查本地 `pnpm` 仓库索引，如果存在则通过 `硬链接` + `切片` 引用至当前项目的 `node_modules` 文件夹 | 使用 `pnpm-workspace.yaml` 进行管理          |

由于 `Yarn Plug'n'Play` （以下简称为 `pnp`）会导致当前仓库下多了 `.pnp.cjs` 和 `.pnp.mjs` 两个 node
加载器文件，容易造成管理混乱，故本文使用相对更节约磁盘的 `pnpm` 解决方案。

# 3. 搭建基础项目

该案例使用 `vue3 + ts + vite + tailwindcss` 的解决方案搭建 ui 组件库，并仿照 `element-plus` 为调用方提供全局引入和按需引入，在最后为
play 平台提供 `HMR` 调试环境、为生产平台提供编译包+类型标注

## 3.1 项目初始化

本方案使用如下结构作为项目结构：

- apps
    - frontend
- packages
    - play
    - ui
- `eslint.config.js`
- `package.json`
- `pnpm-workspace.yaml`

---

具体搭建步骤如下：

1. 在项目根目录使用 `pnpm init` 初始化仓库
2. 按照项目结构创建子项目文件夹
3. 创建 `pnpm-workspace.yaml` 作为 monorepo 的声明和管理文件，具体内容如下：

```yaml
packages:
  - packages/*
  - apps/*
```

4. 移除根项目 `package.json` 中的 main 字段
5. 进入 `packages/ui` 文件夹中使用 `pnpm create vite .` 并选择 `vue + ts` 初始化项目
6. 在子项目中以如下流程对默认模版进行基础验证： ^validate

```shell
# 1.安装依赖
pnpm install

# 2.使用dev环境验证项目结构完整性
pnpm run dev

# 3.测试build环境能否正常打包
pnpm run build
```

## 3.2 调整项目结构

在 monorepo 中支持将通用依赖以根项目的方式安装以便于统一管理，对于非通用依赖可以使用 `peerDependencies`
对其进行版本管理，接下来按照这个原理开始对项目进行调整：

1. 由于当前工作区中所有子项目均采用 `vue3 + ts + vite + tailwindcss` 进行构建，所以绝大多数依赖都可以被提升至根项目
2. 提取以下内容至更项目的 `devDependencies` 中：(直接编辑 `package.json` 即可)
    1. `@vitejs/plugin-vue`
    2. `@vue/tsconfig`
    3. `typescript`
    4. `vite`
    5. `vue-tsc`
3. 由于当前项目将作为组件库使用所以需要将 `vue` 移动至 `devDependencies`，并在根项目的 `peerDependencies` 添加该 `vue`
   版本便于全局版本管理
4. 使用初始化项目时的[[01 基于pnpm workspace的monorepo前端工程化#^validate|方案]] 对当前项目可用性进行验证

## 3.3 添加全局依赖并配置

为了便于管理全局代码风格该项目使用 [[01 基于pnpm workspace的monorepo前端工程化#^antf|Anthony's ESLint config preset]]
进行全局配置。由于所有子项目都将使用

`TailwindCSS` 管理样式，所以也需要全局引入。以下内容均在根目录操作：

1. 初始化并应用 `antf` 的 `eslint` 配置
    1. `pnpm dlx @antfu/eslint-config@latest` 按照引导进行初始化
    2. 使用如下配置让其适合 monorepo 环境：

```js
import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  jsx: true,
  pnpm: true,
  markdown: true,
  typescript: true,
  rules: {
    // 允许使用console.log()  
    'no-console': 'off',
  },
})
```

2. 安装并应用 `TailwindCSS`，对于当前版本 `v4.1` 而言官方要求是作为 `dependencies` 引用的，但实际情况是由 `TailwindCSS` 对
   class 内容解析并生成相关 css 文件，这是一个编译期依赖应该作为 `devDependencies` 被引用。所以当前案例将以
   `devDependencies` 的方式引用
    1. 安装依赖 `pnpm install -Dw tailwindcss @tailwindcss/vite`
    2. 在每个子项目的入口 css 文件中添加引用 `@import "tailwindcss";`
    3. 更改每个子项目的 `vite.config.ts` 添加 `TailwindCSS` 插件：

```ts
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vite'

// https://vite.dev/config/  
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
})
```

## 3.4 使用@作为每个子项目的 src 路径别名

在 `vite + ts` 的环境下需要同时为 `ts解析器` 和 `vite` 配置路径别名，具体配置如下：
在 `tsconfig.json` 中添加如下内容：

```json
{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.node.json"
    }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    }
  }
}
```

在 `vite.config.ts` 中添加如下内容：

```ts
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
```

**由于使用 ts 环境配置这边的 `path` 解析会出现问题，需单独添加 node 的类型依赖：`pnpn install -Dw @types/node`**

# 4. 搭建 ui 组件库

该示例将按以下方式对各子项目命名：

| 项目名            | 功能           |
|----------------|--------------|
| @demo/ui       | UI 组件库       |
| @demo/play     | 组件库在开发期的调试平台 |
| @demo/frontend | 生产项目         |

## 4.1 组件开发

编写一个简单的 `Button` 组件，并使用 `defineOptions` 的 `name` 字段配置为 `XxButton`，*此处建议使用类似 `Xx`、`Zz`
这种不会作为单词起始符的前缀以便于后面编写按需导入组件*

```vue

<script setup lang="ts">
  defineOptions({
    name: 'XxButton',
  })
</script>

<template>
  <div>
    XxButton
  </div>
</template>

<style scoped>

</style>
```

按照如下结构整理 src 目录：

```text
.
├── components
│   ├── XxButton
│   │   ├── index.vue
│   │   └── types.ts
│   ├── index.ts
│   ├── instanceTypes.ts
│   └── types.ts
├── index.css
├── index.ts
└── vite-env.d.ts
```

以后的 `XxButton` 中的泛型类型声明将保存在 `src/components/Button/types.ts` 中

## 4.2 整合导出内容

我们希望以后在使用该组件库时以 `import { XxButton } from '@demo/ui'` 的方式引用，而不是
`import { XxButton } from '@demo/ui/src/components/Button/index.vue'` 所以需要将所有内容进行整合导出

### 4.2.1 整合 vue 文件的导出

在 `src/components/index.ts` 中按照如下的方式维护 vue 文件的导出：

```ts
export {default as XxButton} from './XxButton/index.vue'
```

### 4.2.2 整合 ts 类型声明的导出

在 `src/components/types.ts` 中按照如下的方式维护 vue 文件的导出：

```ts
export * from './XxButton/types'
```

### 4.2.3 整合组件实例类型的类型声明导出

在 vue 组件中我们可以使用 `defineExpose`
的方式向外提供内部变量或方法，为了在父组件调用时不至于出现类型警告需单独导出[[01 基于pnpm workspace的monorepo前端工程化#^instanceType|组件实例类型]]。

在 `src/components/instanceTypes.ts` 中按照如下方式维护组件实例类型：

```ts
/**
 * 动态生成组件实例类型
 */
import type * as components from './index'

type ComponentInstanceMap = {
  [K in keyof typeof components]: InstanceType<typeof components[K]>
}

// 按名称获取单个组件实例类型 TODO 每添加一个组件需单独来此维护  
export type XxButtonInstance = ComponentInstanceMap['XxButton']
```

> [!note] ComponentInstanceMap 内容释义
> 1. `keyof typeof components`- 获取所有组件名称
     >
- 表示获取从`./index`导入的所有导出组件的名称集合。
  >
- `typeof components`：获取模块的完整类型签名（类似`{ XxButton: typeof XxButton, XxInput: typeof XxInput }`）
>        - `keyof`：提取这些类型签名的键集合（即`"XxButton" | "XxInput" | ...`）
> 2. `[K in ...]`- 遍历所有组件名称
     >
- 使用映射类型语法，对每个组件名称`K`进行遍历，为每个组件名称创建对应的类型映射。
>    - 相当于对每个组件名都执行：
       >
- "XxButton" => 对应组件实例类型
>        - "XxInput" => 对应组件实例类型
>        - ...
> 3. `InstanceType<typeof components[K]>`- 获取实例类型
     >
- 这是最核心的部分，表示获取每个组件类对应的实例类型。
  >
- `typeof components[K]`：获取组件类本身的类型（即类的构造函数类型）
>        - `InstanceType<T>`：TypeScript 内置工具类型，用于提取类构造函数的实例类型
>        - 例如：
> ```ts
> class XxButton {}
> type ButtonInstance = InstanceType<typeof XxButton>; // 等价于 XxButton 类型

### 4.2.4 将所有资源全部整合

在入口文件 `src/index.ts`
中需要整合所有资源，在这里面还将整合组件全局注册和按需导入的方法，使用效果参考 [[01 基于pnpm workspace的monorepo前端工程化#^element-plus|element-plus]]
。在这个过程中需要使用到 [[01 基于pnpm workspace的monorepo前端工程化#^UVC|unplugin-vue-componnets]] 插件和 `lodash`需提前安装：
`pnpm install -Dw unplugin-vue-components loash-es @types/lodash-es`。

在 `src/index. ts` 中按照以下方式进行资源整合、全局导入/按需导入插件的开发：

```ts
import type {ComponentResolveResult, Options} from 'unplugin-vue-components'
import type {App} from 'vue'
import {forEach} from 'lodash-es'
import * as components from './components'
import './index.css'

// 导出所有组件和类型标注  
export * from './components'
export * from './components/instanceTypes'
export * from './components/types'

// 组件全局注册方法  
export function CreateStaticTemplate() {
  return (app: App) => {
    forEach(components, (component, name) => {
      app.component(name, component)
    })
  }
}

// 按需导入插件  
export const StaticTemplateResolver: Options = {
  resolvers: [
    (name: string): ComponentResolveResult => {
      if (name.startsWith('Xx')) {
        return {
          name,
          from: `@demo/ui`,
        }
      }
    },
  ],
}
```

## 4.3 准备打包

在打包时需要注意以下几点：

1. 在 `vite` 的默认打包输出中是缺失 ts
   类型声明的，所以需要用到 [[01 基于pnpm workspace的monorepo前端工程化#^dts|vite-plugin-dts]] 插件用于打包，需在组件库的根目录下单独安装
   `pnpm install -D vite-plugin-dts`，在完成安装后可以将该依赖添加至根项目的 `peerDependencies` 便于统一的依赖版本管理
2. 配置输出库的格式（CommonJs、esModule 等）
3. 在编译出的产品中排除 `vue` 和 `lodash` 依赖（此处为 `lodaoshEs` ）
    1. 在项目中使用 `import xxx from 'xxx'` 语法引入的 `devDependencies` 都应该同时在 `peerDependencies`
       中声明并在此处排除，这么做是为了防止出现重复依赖、依赖冲突、幽灵依赖的问题
4. 创建 css 的代码地图便于 play 环境能够在不编译打包的前提下加载组件库通过 `TailwindCSS` 所生成的 css 资源

---

将 `vite.config.ts` 改成如下内容：（注意更改库名）

```ts
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/  
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    dts({tsconfigPath: './tsconfig.app.json'}),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'demo-ui',
      fileName: format => `demo-ui.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['vue', 'lodashEs'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  }
})
```

## 4.4 第一次打包并完善库描述

执行 `pnpm run build` 后 `dist` 目录结构如下： ^dist-struct

```text
.
├── src
│   ├── components
│   │   ├── XxButton
│   │   │   ├── index.vue.d.ts
│   │   │   └── types.d.ts
│   │   ├── index.d.ts
│   │   ├── instanceTypes.d.ts
│   │   └── types.d.ts
│   └── index.d.ts
├── ui.css
├── demo-ui.es.js
└── demo-ui.umd.js
```

要确保目录中必须存在以下 4 个文件：

- `src/index.d.ts`
- `ui.css`
- `demo-ui.es.js`
- `demo-ui.umd.js`
  **须检查其内容完整性**

## 4.5 完善库描述

在 `package.json` 中添加如下内容：

```json
{
  "main": "dist/demo-ui.umd.js",
  "module": "dist/demo-ui.es.js",
  "types": "dist/src/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "import": "./dist/demo-ui.es.js",
      "require": "./dist/demo-ui.umd.js"
    },
    "./style.css": "./dist/ui.css"
  }
}
```

**`exports` 下的 `types` 须排在第一个，不然会被后面的 `import` 覆盖**
再次打包后确认 [[01 基于pnpm workspace的monorepo前端工程化#^dist-struct|dist目录结构]] 是否和之前一样

# 5. 搭建 play 环境

## 5.1 添加组件库依赖

由于 play 环境将用于在组件库的开发期进行调试，届时需要用到 `vite` 的热重载功能，此处有两种解决方案：

1. 使用 `vite build --watch` 监听组件库，这样当组件库代码出现变动时将自动重新打包。缺点是对开发环境负载较大、每次从编译到渲染相对
   `HWR` 而言耗时较久，容易导致开发体验较差
2. 使用别名的方式直接引用组件库源码，相当于把源码作为当前子项目的同名子目录管理，这么做符合普通前端的开发习惯也更容易上手，故当前笔记将使用该解决方案

---
更改当前子项目配置文件：

1. 将 `@demo/ui` 作为项目依赖引入
2. 在 `tsconfig.json` 的 `compilerOptions.paths` 中添加组件库的别名
3. 在 `vite.config.ts` 的 `redolve.alias` 中添加组件库的别名
4. 在 `@demo/ui` 中使用 `tailwindcss` 的 cli 工具动态生成实时 css 文件并导出

### 5.1.1 引入依赖

使用 `"workspace:*"` 的方式将目标组件库以软链接的方式添加至 `@demo/play` 项目的 `node_modules` 中：

```diff
"devDependencies": {
...
+  "@demo/ui": "workspace:*"
...
}
```

### 5.1.2 添加 ts 路径别名

更改 `@demo/play` 子项目的 `tsconfig.json`

```diff
{  
  "files": [],  
  "references": [  
    { "path": "./tsconfig.app.json"},  
    { "path": "./tsconfig.node.json"},  
  ],
+  "include": [  
+    "src/**/*.ts",  
+    "src/**/*.tsx",  
+    "src/**/*.vue",  
+    "vite.config.ts",  
+    
+    "../ui/src/**/*.ts",  
+    "../ui/src/**/*.tsx",  
+    "../ui/src/**/*.vue"  
+  ],  
+  "compilerOptions": {  
+    "baseUrl": ".",  
+    "paths": {  
+      "@/*": ["src/*"],  
+      "@demo/ui": ["../ui/src"],  
+      "@demo/ui/style.css": ["../ui/dist/ui.css"],  
+      "@demo/ui/*": ["../ui/src/*"],  
+    }
+  }
}
```

### 5.1.3 添加 vite 路径别名

更改  `@demo/play` 子项目的 `vite.config.ts`：

```diff
export default defineConfig({  
  ...  
+  resolve: {  
+    alias: {  
+      '@': path.resolve(__dirname, 'src'),  
+      '@demo/ui/style.css': path.resolve(__dirname, '../ui/dist/ui.css'),  
+      '@demo/ui': path.resolve(__dirname, '../ui/src'),  
+    },  
+  }, 
  ... 
})
```

### 5.1.4 添加 dev 环境编译脚本

在 `@demo/ui` 中：

1. 安装官方 cli 工具：`pnpm --filter @demo/ui add @tailwindcss/cli`
2. 将 `package.json` 中的 `dev` 脚本改为 `tailwindcss -i ./src/index.css -o ./dist/demo.css --watch`

## 5.2 挂载组件库

由于是组件库的开发环境，在这个环境下我们希望能够完整体验组件库的功能，所以将使用完整引入的方式挂载。

### 5.2.1 全局引入

将 `main.ts` 更改为以下内容：

```ts
import {CreateStaticTemplate} from '@demo/ui'
import {createApp} from 'vue'
import App from './App.vue'
import './style.css'
import '@demo/ui/style.css'

createApp(App)
  .use(CreateStaticTemplate())
  .mount('#app')
```

### 5.2.2 使用组件库

```vue

<script setup lang="ts">
  import {XxButton} from '@demo/ui'
</script>

<template>
  <XxButton/>
</template>

<style scoped>

</style>
```

**由于 `ui/src/index.ts` 中使用的是结构化导出所以在 import 时需手动用 `{}` 包起来**

# 6. 搭建生产项目

进入 `apps/frontend` 目录后[[01 基于pnpm workspace的monorepo前端工程化#5.1.1 引入依赖|添加组件库依赖]] 后即可与普通组件库一样使用了
**在使用前务必先将组件打包，这边将使用组件库编译后的版本**

为了减少最终生产环境打包体积当前笔记采用按需引入方案，由于已经全局引入了 `unplugin-vue-components` 所以直接更改
`frontend/vite.config.ts` 为以下内容:

```ts
import path from 'node:path'
import {UIResolver} from '@demo/ui'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import {defineConfig} from 'vite'

// https://vite.dev/config/  
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Components(UIResolver),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
```

![[01 基于pnpm workspace的monorepo前端工程化#5.2.2 使用组件库]]

# 6. 优化开发体验

## 6.1 调整 ts 配置文件

在之前的配置过程中会发现 `tsconfig.app.json` 和 `tsconfig.node.json` 在多处重复创建，`tsconfig.json`
的内容也极其相近，在内容相同的前提下存在多份配置文件是一个危险的行为，这种时候最好是将它们提取出来进行统一管理。

1. 将使用 `pnpm create vite` 时自动创建的这 3 个文件移动至根目录
    1. 对于更改过的 `tsconfig.json` 而言直接在根目录创建同名文件并将默认内容复制进去即可
2. 在 `tsconfig.app.json` 和 `tsconfig.node.json` 文件中添加 `compilerOptions.composite: true`
3. 每一个子项目的 `tsconfig.json` 都基于以下模版搭建即可：

```json
{
  "extends": [
    "../../tsconfig.app.json",
    "../../tsconfig.node.json"
  ],
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "vite.config.ts"
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    }
  }
}
```

## 6. 2 调整 scripts 脚本内容

将根目录下的 `package.json` 中的 scripts 调整为：

```json
{
  "scripts": {
    "dev:play": "pnpm --filter @demo/ui preDev && pnpm --filter @demo/play dev",
    "dev:frontend": "pnpm build:ui && pnpm --filter @demo/frontend dev",
    "build:ui": "pnpm --filter @demo/ui build",
    "build:frontend": "pnpm build:ui && pnpm --filter @demo/frontend build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

之后想要启动项目时只要在项目根目录下选择对应脚本即可

| 脚本名              | 含义               |
|------------------|------------------|
| `dev:play`       | play 环境开发 UI 组件库 |
| `dev:frontend`   | 开发生产项目           |
| `build:ui`       | 打包 UI 组件库        |
| `build:frontend` | 打包生产项目           |
| `lint`           | 代码审查             |
| `lint:fix`       | 代码格式化            |

# 7. 解决方案参考

该笔记参考了 [Let's Talk Dev的视频编写](https://youtu.be/HM03XGVlRXI?si=KvWnsxhPN6eshC3i)
，案例代码也可以在 [Github](https://github.com/mihailtd/demo-monorepo) 直接参考。

# 8. 资料引用

- [Anthony's ESLint config preset](https://github.com/antfu/eslint-config) ^antf
- [TailwindCSS](https://tailwindcss.com/)
- [Vue 组件实例类型文档](https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-template-refs)
  ^instanceType
- [element-plus 导入配置](https://element-plus.org/zh-CN/guide/quickstart.html) ^element-plus
- [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components) ^UVC
- [vite-plugin-dts](https://github.com/qmhc/vite-plugin-dts) ^dts
