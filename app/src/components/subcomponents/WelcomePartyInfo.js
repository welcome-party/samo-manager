import React from 'react';
import './WelcomePartyInfo.css';

function WelcomePartyInfo() {
    return (
        <div>
            <span className='welcome-party-logo'></span>
            <div className='samo-moon-message small-text'>Let's get Samo to the moon</div>
            <div className='welcome-party-message large-text'>Welcome party allows you get free $SAMO for onoarding friends onto Phantom</div>
            <div className='backed-by-team-message medium-text'>Backed by the <img src={require('../../assets/samo_logo.png')} className='samo-logo' alt='SAMO'></img> team</div>
        </div>
    );
}

export default WelcomePartyInfo;
