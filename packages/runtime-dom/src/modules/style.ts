export function patchStyle(el, prevValue, nextValue) {
  const style = el.style // 获取样式
  if(nextValue == null) {
    el.removeAttribute('style') // 删除所有样式
  }else {
    // 1.老的里新的有没有
    if(prevValue) {
      for(let key in prevValue) {
        if(nextValue[key] == null) {
          style[key] = ''
        }
      } 
    }
    // 2.新的里面需要复制到style里
    for(let key in nextValue) {
      style[key] = nextValue[key]
    }

  }
}