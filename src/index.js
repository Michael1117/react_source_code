import React from './react';

class Counter extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      odd: true
    }
  }
  componentDidMount() {
    setTimeout(() => {
      this.setState({odd: !this.state.odd})
    })
  }
  
  handleClick = () => {
    this.setState({number: this.state.number + 1})
  }
  render() {
    if (this.state.odd) {
      return React.createElement('ul', {id: 'oldCounter'},
        React.createElement('li', { key: 'A' }, 'A'),
        React.createElement('li', { key: 'B' }, 'B'),
        React.createElement('li', { key: 'C' }, 'C'),
        React.createElement('li', { key: 'D' }, 'D'),
      )
    }
    return React.createElement('ul', {id: 'newCounter'},
      React.createElement('span', { key: 'A' }, 'A1'),
      React.createElement('li', { key: 'C' }, 'C1'),
      React.createElement('li', { key: 'B' }, 'B1'),
      React.createElement('li', { key: 'E' }, 'E1'),
      React.createElement('li', { key: 'F' }, 'F1'),
    )
  }
}

// <Counter name="计数器"></Counter>
let element = React.createElement(Counter, {name: '计数器'})
React.render(element, document.getElementById('root'))