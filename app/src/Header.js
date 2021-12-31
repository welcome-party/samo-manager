import React from 'react';
import { Link, useParams } from 'react-router-dom';

import './Header.css';

const HeaderLink = ({ page, title, selected }) => {
  let className = selected ? 'headerlink-no-link ' : '';
  className += 'headerlink-title';

  return (
    <Link to={`/${page}`} className={className}>
      {title}
      <div className={selected ? 'headerlink-dot-active' : 'headerlink-dot'}>
        •
      </div>
    </Link>
  );
};

const Header = () => {
  const { page } = useParams();

  return (
    <div className='header'>
      <HeaderLink page='home' title='Home' selected={page === 'home'} />
      <HeaderLink page='send-voucher' title='Send Voucher' selected={page === 'send-voucher'} />
      <HeaderLink page='list-vouchers' title='List Vouchers' selected={page === 'list-vouchers'} />
    </div>
  );
};

export default Header;
