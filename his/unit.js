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
      return true
    }
  }
  getMarkUp(reactid) {
    this._reactid = reactid;
    let {
      type: Component,
      props
    } = this._currentElement
    
    let componentInstance = new Component(props)
    let renderElement = componentInstance.render();
    
    let renderedUnit = createUnit(renderElement)
    console.log(renderedUnit)
    $(document).on('mounted', () => {
      componentInstance.componentDidMount && componentInstance.componentDidMount()
    })
    return renderedUnit.getMarkUp(this._reactid)

  }
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