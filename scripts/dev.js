// 把package目录下得目标包进行打包
const execa = require("execa"); // 开启子进程, 使用rolup打包

const target = 'compiler-dom'
build(target)
// 对我们目标进行一次打包, 并行打包
async function build(target) {
  await execa("rollup", ['-cw', '--environment', `target:${target}`], {
    stdio: 'inherit' // 子进程共享父进程
  })
}