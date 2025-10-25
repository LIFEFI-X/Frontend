import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, InlineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver, NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import Unfonts from 'unplugin-fonts/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const config: InlineConfig = {
    plugins: [
      vue(),
      vueDevTools(),
      AutoImport({
        resolvers: [],
        // 自定引入 Vue VueRouter API,如果还需要其他的可以自行引入
        imports: ['vue', 'vue-router'],
        // 调整自动引入的文件位置
        dts: 'src/types/auto-import.d.ts',
        // 解决自动引入eslint报错问题 需要在eslintrc的extend选项中引入
        eslintrc: {
          enabled: true,
          // 配置文件的位置
          filepath: './.eslintrc-auto-import.json',
          globalsPropValue: true
        }
      }),
      Components({
        dirs: ['src/components', 'src/layout'],
        resolvers: [
          AntDesignVueResolver({
            importStyle: false,
            resolveIcons: true
          }),
          NaiveUiResolver()
        ],
        dts: 'src/types/components.d.ts'
      }),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [fileURLToPath(new URL('./src/assets/icons', import.meta.url))],
        // 指定symbolId格式
        symbolId: 'icon-[dir]-[name]'
      }),
      nodePolyfills({
        globals: {
          Buffer: true
        }
      }),
      Unfonts({
        custom: {
          families: [
            {
              name: 'Urbanist',
              local: 'Urbanist',
              src: './src/assets/fonts/*'
            }
          ],
          display: 'swap',
          preload: true,
          prefetch: false,
          injectTo: 'head-prepend'
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      proxy: {
        '/api': {
          target: loadEnv(mode, process.cwd()).VITE_APP_API_ORIGIN,
          changeOrigin: true
          // rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/media': {
          target: loadEnv(mode, process.cwd()).VITE_APP_API_ORIGIN,
          changeOrigin: true
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }

  // if (mode === 'production') {
    config.build = {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }
  // }

  return config
})
