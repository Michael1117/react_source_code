import React from './react';

class Counter extends React.Component{
  constructor(props) {
    super(props)
    this.state = {number: 0}
  }
  componentWillMount() {
    console.log('Counter componentWillMount')
  }

  componentDidMount() {
    //console.log('Counter componentDidMount')
    setInterval(() => {
      this.setState({number: this.state.number + 1})
    }, 1000)
  }
  shouldComponentUpdate(nextState, nextProps) {
    return true
  }
  componentDidUpdate() {
    console.log('Counter componentDidUpdate')
  }
  handleClick = () => {
    this.setState({number: this.state.number + 1})
  }
  render() {
    //console.log('render')
    let p = React.createElement('p', { },  this.state.number);
    let button = React.createElement('button', {onClick: this.handleClick}, '+')
    return React.createElement('div', {style:{backgroundColor: this.state.number % 2 == 0 ? "red":"green"}}, p, button)
    
  }
}

// <Counter name="计数器"></Counter>
let element = React.createElement(Counter, {name: '计数器'})
React.render(element, document.getElementById('root'))