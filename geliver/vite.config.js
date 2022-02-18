import path from 'path'
import reactRefresh from '@vitejs/plugin-react-refresh'
// import { VitePWA } from 'vite-plugin-pwa'

/**
 * @type { import('vite').UserConfig }
 */
export default {
    define: {
        'process.env': {},
    },
    build: {
        outDir: '../dist',
    },
    base: "/geliver/",
    plugins: [reactRefresh()],
    resolve: {
        alias: {
            '#': path.resolve(__dirname, "./src"),
        },
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
                modifyVars: {
                    '@base-color': '#08979C'
                }
            },
        }
    }
};