let queue = []
// job 是 reactEffect(代表一次更新)
export function queueJob(job) {
  if(!queue.includes(job)) {
    queue.push(job)
    // 刷新
    queueFlush()
  }
}

let isFlushPending = false // 表示正在刷新
function queueFlush() {
  if(!isFlushPending) {
    isFlushPending = true
    // Promise.resolve()返回一个promise
    Promise.resolve().then(flushJobs)
  }
}

function flushJobs() {
  isFlushPending = false
  // 清空时,先刷新父在刷新子
  queue.sort((a, b) => a.uid - b.uid)
  for(let i = 0; i < queue.length; i++){
    const job = queue[i]
    job()
  }
  // 清空队列
  queue.length = 0
}