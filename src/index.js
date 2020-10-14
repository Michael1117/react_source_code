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
 /*  increment = () => {
    
    return this.state.number;
  } */
  render() {
    console.log('render')
   /*  let p = React.createElement('p', { style: {color: 'red'}}, this.props.name,  this.state.number);
    let button = React.createElement('button', {onClick: this.increment}, '+')
    return React.createElement('div', {id:'counter'}, p, button) */
    return this.state.number;
  }
}

// <Counter name="计数器"></Counter>
let element = React.createElement(Counter, {name: '计数器'})
React.render(element, document.getElementById('root'))