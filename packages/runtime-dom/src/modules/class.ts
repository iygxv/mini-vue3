

export function patchClass(el, value) {
  if(value == null) {
    value = ''
  }
  el.className = value
}