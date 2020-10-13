import $ from 'jquery'
import {createUnit} from './unit'
import {createElement} from './element'
import {Component} from './component'
let React = {
  render,
  createElement,
  Component,
  rootIndex: 0
}

// 此元素可能是一个文本节点、DOM节点(div)、或者 自定义组件Counter
function render(element, container) {
  //container.innerHTML = `<span data-reactid="${React.rootIndex}">${element}</span>`
  // unit单元就是用来负责渲染的， 负责把元素转换
  let unit = createUnit(element)
  //console.log(unit)
  let markUp = unit.getMarkUp(React.rootIndex);   // 用来返回HTML标记
  $(container).html(markUp)
  $(document).trigger('mounted')
}

export default React