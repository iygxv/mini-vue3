export const CREATE_VNODE = Symbol(`createVNode` )
export const TO_DISPLAY_STRING = Symbol(`toDisplayString`)
export const OPEN_BLOCK = Symbol(`openBlock`)
export const CREATE_BLOCK = Symbol(`createBlock`)
export const FRAGMENT = Symbol(`Fragment`)
export const CREATE_TEXT = Symbol(`createTextVNode`)

export const helperNameMap:any = {
  [FRAGMENT]: `Fragment`,
  [OPEN_BLOCK]: `openBlock`,
  [CREATE_BLOCK]: `createBlock`,
  [CREATE_VNODE]: `createVNode`,
  [CREATE_TEXT]: `createTextVNode`,
  [TO_DISPLAY_STRING]: `toDisplayString`
}
