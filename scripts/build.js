// 把package目录下得所有包进行打包

const fs = require("fs");
const execa = require("execa"); // 开启子进程, 使用rolup打包


const targets = fs.readdirSync('packages').filter(f => {
   if(fs.statSync(`packages/${f}`).isDirectory()) {
     return true
   }
   return false
})
// 对我们目标进行一次打包, 并行打包
async function build(targets) {
  await execa("rollup", ['-cw', '--environment', `target:${targets}`], {
    stdio: 'inherit' // 子进程共享父进程
  })
}
function runParallel(targets, build) {
   const res = []
   for(const item of targets) {
     const p = build(item)
     res.push(p)
   }
   return Promise.all(res)
}
runParallel(targets, build)