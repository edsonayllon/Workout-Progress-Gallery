import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  state = {
    images: [],
    current: 0
  }

  fetchApi(){
    fetch('/files')
     .then(res => res.json()
   ).then(json => {
     this.setState({ images: json });
   });
  }

  componentWillMount() {
    this.fetchApi();
  }


  forward =  () => {
    this.fetchApi();
    console.log(this.state.images)
    if (this.state.current < this.state.images.length -1){
      this.setState({
        current: this.state.current + 1
      });
    } else {
      this.setState({
        current: 0
      })
    }
  }

  backward =  () => {
    if (this.state.current === 0){
      this.setState({
        current: this.state.images.length - 1
      });
    } else {
      this.setState({
        current: this.state.current - 1,
      });
    }
  }




  render() {
    const imgsrc = "/images/" + this.state.images[this.state.current];
    return (
      <div className="App">
        <header className="App-header">
          <h1>Workout Progress</h1>
        </header>
        <div id="content">
          <a className="Arrow" data-key="37" onClick={this.backward}  href="#">&#9664;</a>


          <img src={imgsrc} alt="" id="gallery"/>

          <div id = "details">
            <ul>
              <li>Date: <span id = "date"></span></li>
              <li>AI Ratio: <span id = "aiRatio"></span></li>
            </ul>
          </div>

          <a className="Arrow" data-key="39" onClick={this.forward} href="#">&#9654;</a>

        </div>
      </div>
    );
  }
}

export default App;
