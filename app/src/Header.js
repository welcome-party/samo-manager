import React from 'react';
import { Link } from 'react-router-dom';
import headerLogo from './assets/welcome_party_logo_header.png';

const Header = () => {
  return (
    <div className='row header'>
      <div className='col-md-3'>
        <Link to='create-voucher'><img src={headerLogo} className="img-responsive" alt="Welcome Party"></img></Link>
      </div>
      <div className='col-md-5'>
      </div>
      <div className='col-md-4'>
        <Link to='list-vouchers' className='col-md-4 link-text'>LIST VOUCHERS</Link>
      </div>
    </div>
  );
};

export default Header;
