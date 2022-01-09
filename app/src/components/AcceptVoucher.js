import React from 'react';
import './AcceptVoucher.css';
import WelcomePartyInfo from './subcomponents/WelcomePartyInfo.js';

const AcceptVoucher = () => {
    return (
        <div className='content'>
            <WelcomePartyInfo />
            <div className='input-area'></div>
        </div>
    );
};

export default AcceptVoucher;
