import {
  Element,
} from './element'
import $ from 'jquery'
class Unit {
  constructor(element) {
    // 挂载到所有属性上的都以_开头
    this._currentElement = element
  }
  getMarkUp() {
    throw Error('此方法不能被调用')
  }
}

class TextUnit extends Unit {
  getMarkUp(reactid) {
    this._reactid = reactid;
    return `<span data-reactid="${reactid}">${this._currentElement}</span>`
  }
  update(nextElement) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement
      $(`[data-reactid="${this._reactid}"]`).html(this._currentElement);
      }
    }
    
}

/* 
let element = React.createElement('button',
  { id: 'sayHello', style: { color: 'red', backgroundColor: 'green' }, onClick: sayHello },
  'say', React.createElement('b', {}, 'Hello')
)
<button id="sayHello" style="color: red; background-color: 'green'" onClick="sayHello()">
  <span>say</span>
  <b>Hello</b>
</button>

{type:'button', props: {id: 'sayHello'}, children: ['say', {type: '',{}, 'Hello'}]}
*/
class NativeUnit extends Unit {
  update(nextElement) {
    let oldProps = this._currentElement.props;
    let newProps = nextElement.props;
  }
  getMarkUp(reactid) {
    this._reactid = reactid;
    let {
      type,
      props
    } = this._currentElement
    let tagStart = `<${type} data-reactid="${this._reactid}"`;
    let childString = '';
    let tagEnd = `</${type}>`;

    for (let propName in props) {
      if (/^on[A-Z]/.test(propName)) { // 绑定事件了
        let eventName = propName.slice(2).toLowerCase();

        $(document).delegate(`[data-reactid="${this._reactid}"]`, `${eventName}.${this._reactid}`, props[propName])
      } else if (propName === 'style') { // 是一个样式对象
        let styleObj = props[propName];
        let styles = Object.entries(styleObj).map(([attr, value]) => {
          /*  attr.replace(/[A-Z]/g, function (matched, group1) {
             return `-${group1.toLowerCase()}`
           }) */
          return `${attr.replace(/[A-Z]/g, m=>`-${m.toLowerCase()}`)}:${value}`;
        }).join(";");
        tagStart += (` style="${styles}" `)
      } else if (propName === 'className') { // 如果是一个类名
        tagStart += (`class="${props[propName]}" `)
      } else if (propName === 'children') {
        let children = props[propName]
        children.forEach((child, index) => {
          let childUnit = createUnit(child); // 
          let childMarkUp = childUnit.getMarkUp(`${this._reactid}.${index}`);
          childString += childMarkUp;
          //console.log(childString)
        })
      } else {
        tagStart += (` ${propName}=${props[propName]} `)
      }
      
    }
    return tagStart + ">" + childString + tagEnd
  }
}

class CompositeUnit extends Unit {
  update(nextElement, partialState) {
    // 获取到新的元素
    this._currentElement = nextElement || this._currentElement
    // 获取新的状态  不管要不要更新组件 ，组件的状态一定要修改
    let nextState = this._componentInstance.state =  Object.assign(this._componentInstance.state, partialState)
    // 新的属性对象
    let nextProps = this._currentElement.props;
    if (this._componentInstance.shouldComponentUpdate && !this._componentInstance.shouldComponentUpdate(nextProps, nextState)) {
      return;
    }
    // 下面要进行比较更新了  先得到上次渲染的单元
    let preRenderedUnitInstance = this._renderedUnitInstance
    console.log(preRenderedUnitInstance)
    let preRenderedElement = preRenderedUnitInstance._currentElement
    let nextRenderElement = this._componentInstance.render()
    // 如果新旧两个元素类型一样，则可以进行深度比较，如果不一样，直接干掉老的元素，新建新的元素
    if (shouldDeepCompare(preRenderedElement, nextRenderElement)) {
      // 如果可以进行深比较，则把更新的工作交给上次渲染出来的那个
      preRenderedUnitInstance.update(nextRenderElement);
      this._componentInstance.componentDidUpdate&& this._componentInstance.componentDidUpdate()
    } else {
      this._renderedUnitInstance = createUnit(nextRenderElement)
      let nextMarkUp = this._renderedUnitInstance.getMarkUp()
      $(`[data-reactid="${this._reactid}"]`).replaceWith(nextMarkUp)
    }
  }
  getMarkUp(reactid) {
    this._reactid = reactid;
    let {
      type: Component,
      props
    } = this._currentElement
    
    let componentInstance = this._componentInstance = new Component(props)
    // 让组件的实例的currentUnit属性等于当前的unit
    componentInstance._currentUnit = this;
    // 有组件将要渲染的函数的话执行
    componentInstance.componentWillMount && componentInstance.componentWillMount();
    // 调用组件的render方法，获得要渲染的元素
    let renderedElement = componentInstance.render()
    // 得到这个元素对应的unit
    let renderedUnitInstance = this._renderedUnitInstance = createUnit(renderedElement);
    
    // 通过unit可以获得
    let renderedMarkUp = renderedUnitInstance.getMarkUp(this._reactid);
    // 在这个时候绑定一个事件
    $(document).on('mounted', () => {
      componentInstance.componentDidMount && componentInstance.componentDidMount();
    })
    return renderedMarkUp;
  }
}
// 判断两个元素的类型一不一样
function shouldDeepCompare(oldElement, newElement) {
  if (oldElement != null && newElement != null) {
    let oldType = typeof oldElement;
    let newType = typeof newElement;
    if ((oldType==='string' || oldType === 'number') && (newType==='string' || newType === 'number')) {
      return true
    }

    if (oldElement instanceof Element && newElement instanceof Element) {
      return oldElement.type == newElement.type;
    }
  }
  return false;
}
function createUnit(element) {
  if (typeof element === 'string' || typeof element === 'number') {
    return new TextUnit(element)
  }
  if (element instanceof Element && typeof element.type === 'string') {
    return new NativeUnit(element);
  }

  if (element instanceof Element && typeof element.type === 'function') {
    return new CompositeUnit(element)
  }
}

export {
  createUnit
}