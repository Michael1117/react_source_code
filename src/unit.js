import {Element} from './element'
import $, { type } from 'jquery'
import types from './types'
let diffQueue = [];    // 差异队列
let updateDepth = 0;  // 更新级别

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
    console.log(nextElement)
    let oldProps = this._currentElement.props;
    let newProps = nextElement.props;
    this.updateDOMProperties(oldProps, newProps);
    this.updateDOMChildren(nextElement.props.children)
  }
  // 此处要把新的子节点传过来， 和老的子节点进行对比，然后找出差异
  updateDOMChildren(newChildrenElements) {
    updateDepth++;
    this.diff(diffQueue, newChildrenElements);
    //console.log(diffQueue)
    updateDepth--;
    if (updateDepth === 0) {
      this.patch(diffQueue);
      diffQueue = [];
    }
  }
  patch(diffQueue) {
    let deleteChildren = []; // 这里放着所有将要删除的节点
    let deleteMap = {}; // 这里存放能复用的节点
    for (let i = 0; i < diffQueue.length; i++) {
      let difference = diffQueue[i];
      if (difference.type === types.MOVE || difference.type === types.REMOVE) {
        let fromIndex = difference.fromIndex;
        let oldChild = $(difference.parentNode.children().get(fromIndex));
        deleteMap[fromIndex] = oldChild;
        deleteChildren.push(oldChild)

      }
    }
    $.each(deleteChildren, (idx, item) => $(item).remove())
    for (let i = 0; i < diffQueue.length; i++) {
      let difference = diffQueue[i]
      switch (difference.type) { 
        case types.INSERT:
          this.insertChildAt(difference.parentNode, difference.toIndex, $(difference.markUp))
          break;
        case types.MOVE:
          this.insertChildAt(difference.parentNode, difference.toIndex, deleteMap[difference.fromIndex])
          break;
        default:
          break;
      }
    }
  }
  insertChildAt(parentNode, index, newNode) {
    let oldChild = parentNode.children().get(index)
    oldChild?newNode.insertBefore(oldChild):newNode.appendTo(parentNode)
  }
  diff(diffQueue, newChildrenElements) {
    // 1 生成一个map， key=老的unit
    let oldChildrenUnitMap = this.getOldChildrenMap(this._renderedChildrenUnits);
    // 2 生成一个新的儿子unit数组
    let { newChildrenUnitMap, newChildrenUnits } = this.getNewChildren(oldChildrenUnitMap, newChildrenElements);
    let lastIndex = 0;    // 是一个已经确定位置的索引
    for (let i = 0; i < newChildrenUnits.length; i++){
      let newUnit = newChildrenUnits[i];
      // newKey就是A
      let newKey = (newUnit._currentElement.props && newUnit._currentElement.props.key) || i.toString();
      let oldChildUnit = oldChildrenUnitMap[newKey];
      if (oldChildUnit === newUnit) { // 如果新老一致的话  复用老节点

        if (oldChildUnit._mountIndex < lastIndex) {
          diffQueue.push({
            parentId: this._reactid,
            parentNode: $(`[data-reactid="${this._reactid}"]`),
            type: types.MOVE,
            fromIndex: oldChildUnit._mountIndex,
            toIndex: i
          })
        }
        lastIndex = Math.max(lastIndex, oldChildUnit._mountIndex)       
      } else {  // 不相等  新节点
        diffQueue.push({
          parentId: this._reactid,
          parentNode: $(`[data-reactid="${this._reactid}"]`),
          type: types.INSERT,
          toIndex: i,
          markUp: newUnit.getMarkUp(`${this._reactid}.${i}`)
        })
      }
      newUnit._mountIndex = i;
    }
    for (let oldKey in oldChildrenUnitMap) {
      let oldChild = oldChildrenUnitMap[oldKey];
      if (!newChildrenUnitMap.hasOwnProperty(oldKey)) {
          diffQueue.push({
            parentId: this._reactid,
            parentNode: $(`[data-reactid="${this._reactid}"]`),
            type: types.REMOVE,
            fromIndex: oldChild._mountIndex
          })
      }
    }
  }
  getNewChildren(oldChildrenUnitMap, newChildrenElements) {
    let newChildrenUnits = [];
    let newChildrenUnitMap = {}
    newChildrenElements.forEach((newElement, index) => {
      let newKey = (newElement.props && newElement.props.key) || index.toString();
      let oldUnit = oldChildrenUnitMap[newKey]; // 老的unit
      let oldElement = oldUnit && oldUnit._currentElement;    // 获取老元素
      if (shouldDeepCompare(oldElement, newElement)) {
        oldUnit.update(newElement);
        newChildrenUnits.push(oldUnit);
        newChildrenUnitMap[newKey] = oldUnit;
      } else {
        let nextUnit = createUnit(newElement);
        newChildrenUnits.push(nextUnit);
        newChildrenUnitMap[newKey] = nextUnit;
      }


    })
    return { newChildrenUnits, newChildrenUnitMap };
  }
  getOldChildrenMap(childrenUnits = []) {
    let map = {};
    for (let i = 0; i < childrenUnits.length; i++) {
      let unit = childrenUnits[i];
      let key = (unit._currentElement.props && unit._currentElement.props.key) || i.toString();
      map[key] = unit;
    }
    return map;
  }
  updateDOMProperties(oldProps, newProps) {
    let propName;
    for (propName in oldProps) {
      if (!newProps.hasOwnProperty(propName)) {
        $(`[data-reactid="${this._reactid}"]`).removeAttr(propName)
      } 
      if (/^on[A-Z]/.test(propName)) {
        $(document).undelegate(`.${this._reactid}`)
      }
    }
    for (propName in newProps) {
      if (propName === 'children') {  // 如果是子组件
        continue;
      } else if (/^on[A-Z]/.test(propName)) {
        let eventName = propName.slice(2).toLowerCase();
        $(document).delegate(`[data-reactid="${this._reactid}"]`, `${eventName}.${this._reactid}`, newProps[propName])
      } else if (propName === 'className') {
        //$(`[data-reactid="${this._reactid}"]`)[0].className = newProps[propName];
        $(`[data-reactid="${this._reactid}"]`).attr('class', newProps[propName])
      }else if (propName === 'style') {
        let styleObj = newProps[propName];
        Object.entries(styleObj).map(([attr, value]) => {
          $(`[data-reactid="${this._reactid}"]`).css(attr, value)
        })
      } else {
        $(`[data-reactid="${this._reactid}"]`).attr(propName, newProps[propName])
      }
    }
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
    this._renderedChildrenUnits = []
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
        let children = props[propName];
        children.forEach((child, index) => {
          let childUnit = createUnit(child); // 可能是一个字符串，也可以是一个react元素
          childUnit._mountIndex = index;    // 每个unit有一个_mountIndex属性 指向自己在父节点中的位置
          this._renderedChildrenUnits.push(childUnit)
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
    //console.log(preRenderedUnitInstance)
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