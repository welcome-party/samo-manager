import React from 'react';
import { Link } from 'react-router-dom';

import './Header.css';

const Header = () => {
  return (
    <div className='header'>
      <Link to='create-voucher' className='welcome-party-logo-header'></Link>
      <Link to='list-vouchers' className='list-voucher-header-link link-text'>LIST VOUCHERS</Link>
    </div>
  );
};

export default Header;
