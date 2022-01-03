import React from 'react';
import './Home.css';

const Home = () => {
    return (
        <div className='Content'>
            <p>
                Hi! Welcome to Solana.
                This app makes it easier for you to invite your friends to Solana Block chain.<br /><br />

                Go ahead and "Send voucher" ☝️ to someone with their email address. Remember a voucher is only valid for 5 days.<br /><br />
                
                Once you have sent the voucher, recipient will get an email with a link.<br /><br />
                Once they have accepted the voucher (in the timeframe) you will receive confirmation with their Solana wallet Public Key.<br /><br />
                
                After that you can transfer tokens to them!
            </p>
        </div>
    );
};

export default Home;
