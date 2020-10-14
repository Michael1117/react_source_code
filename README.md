## this._componentInstance  当前组件的实例
## this._renderedUnitInstance  当前组件render方法返回的react元素对应的unit  _currentElement=react元素

## React 15的dom diff 算法

首先比较父节点，类型不同，直接删掉重新创建；类型相同，属性不同，只更改属性
再深度比较子节点，子节点比较与父节点类似