import { isOn } from "@vue/shared"
import { patchAttr } from "./modules/attrs"
import { patchClass } from "./modules/class"
import { patchEvent } from "./modules/events"
// import { patchDOMProp } from "./modules/props"
import { patchStyle } from "./modules/style"

/**
 * 属性相关
 * @param el 元素
 * @param key 键
 * @param prevValue 旧值 
 * @param nextValue 新值
 */
export const patchProp = (el, key, prevValue, nextValue) => {
  // class操作
  if(key === 'class') {
    patchClass(el, nextValue)  
  }else if(key === 'style') { // style操作
    patchStyle(el, prevValue, nextValue)
  }else if(isOn(key)) {  // 判断事件
    patchEvent(el, key, nextValue)
  }else { // 其他属性操作
    patchAttr(el, key, nextValue)
  }
  
}