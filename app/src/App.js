import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import './App.css';
import Header from './Header';
import Home from './components/Home';
import SendVoucher from './components/SendVoucher';
import ListVouchers from './components/ListVouchers';
import AcceptVoucher from './components/AcceptVoucher';

function App() {
  return (
    <div className='App'>
      <Router>
        <Route path='/:page' component={Header} />
        <Route exact path='/' component={Header} />

        <Route exact path='/' component={Home} />
        <Route exact path='/home' component={Home} />
        <Route exact path='/send-voucher' component={SendVoucher} />
        <Route exact path='/list-vouchers' component={ListVouchers} />
        <Route exact path='/accept-voucher' component={AcceptVoucher} />
      </Router>
    </div>
  );
}

export default App;
