import React from './src/react';
// jsx浏览器不能识别和运行， 要靠babel转换成javascript
function sayHello() {
  alert('hello')
}
/* let element = (
  <button id="sayHello" style={{color: 'red', backgroundColor: 'green'}} onClick={sayHello}>
    say
     <b>Hello</b>
  </button>
)
 */
let element = React.createElement('button',
  { id: 'sayHello', style: { color: 'red', backgroundColor: 'green' }, onClick: sayHello },
  'say', React.createElement('b', {}, 'Hello')
)

// {type: 'button', props: {id: 'sayHello'}}
React.render(element, document.getElementById('root'))