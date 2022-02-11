import React from 'react';
import mainLogo from '../assets/welcome_party_logo_main.png';
import samoLogo from '../assets/samo_logo.png';

function WelcomePartyInfo() {
    return (
        <div>
            <div className='row'>&nbsp;</div><div className='row'>&nbsp;</div>
            <div className='row'>
                <div className='col'>
                    <img src={mainLogo} className="img-fluid" alt="Welcome Party"></img>
                </div>
            </div>
            <div className='row'>
                <div className='col'>
                    <div className='small-text'>Let's get Samo to the moon</div>
                </div>
            </div>
            <div className='row'>&nbsp;</div><div className='row'>&nbsp;</div>
            <div className='row'>
                <div className='col'>
                    <div className='large-text'>Welcome party allows you get free $SAMO for onoarding friends onto Phantom</div>
                </div>
            </div>
            <div className='row'>&nbsp;</div><div className='row'>&nbsp;</div>
            <div className='row'>
                <div className='col'>
                    <div className='medium-text'>Backed by the <img src={samoLogo} className='img-fluid' alt='SAMO'></img> team</div>
                </div>
            </div>

        </div>
    );
}

export default WelcomePartyInfo;
