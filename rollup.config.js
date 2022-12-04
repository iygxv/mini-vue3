// rollup配置
import path from 'path'
import json from '@rollup/plugin-json'
import resolvePlugin from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'

// 找到package.json
const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.target.trim()) // 找到要打包的包

const resolve = (p) => path.resolve(packageDir, p) // 相对于某包目录


const pkg = require(resolve('package.json'))
const name = path.basename(packageDir) // 获取文件名


// 对打包类型做一个映射表
const outputConfig = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundles.js`),
    format: 'esm'
  },
  'cjs': {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs'
  },
  'global': {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife'
  }
}

const options = pkg.buildOptions // 获取到自定义选项

function createConfig(format, output) {
  output.name = options.name
  // 生产rollup配置
  return {
    input: resolve('src/index.ts'),
    output,
    plugins: [
       json(),
       ts({
        tsconfig: path.resolve(__dirname, 'tsconfig.json')
       }),
       resolvePlugin() // 解析第三方模块插件
    ]
  }

}
const finallyRollupConfig = options.formats.map(format => { // 遍历打包
  return createConfig(format, outputConfig[format])
})

export default finallyRollupConfig

