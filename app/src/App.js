import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import './App.css';
import Header from './Header';
import Footer from './Footer';
import SendVoucher from './components/SendVoucher';
import ListVouchers from './components/ListVouchers';
import AcceptVoucher from './components/AcceptVoucher';

function App() {
  return (
    <div className='App'>
      <Router>
        <Header />
        <Route exact path='/' component={SendVoucher} />
        <Route exact path='/send-voucher' component={SendVoucher} />
        <Route exact path='/list-vouchers' component={ListVouchers} />
        <Route exact path='/accept-voucher' component={AcceptVoucher} />
        <Footer />
      </Router>
    </div>
  );
}

export default App;
