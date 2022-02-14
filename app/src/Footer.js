import React from 'react';
import samoyedDog from './assets/samoyed_dog.png';
import ellipse from './assets/ellipse.png';


const Footer = () => {
  return (
    <div className='row mt-auto'>
      <div className='col'>
        <div className='row'>
          <div className='col-md-8 d-none d-lg-block' >
            <img src={ellipse} className='img-fluid ellipse-footer' alt='Moon'></img>
          </div>
          <div className='col-md-4 d-none d-lg-block'>
            <img src={samoyedDog} className='img-fluid samoyed-dog-footer' alt='Samoyed Dog'></img>
          </div>
        </div>
        <div className='row  footer'>
          <div className='col-md-2'>
            <a href="https://google.com/" target="_blank" rel="noreferrer noopener" className='link-text'>
              SOCIAL
            </a>
          </div>
          <div className='col-md-6' />
          <div className='col-md-2'>
            <a href="https://google.com/" target="_blank" rel="noreferrer noopener" className='link-text'>
              COMPANY
            </a>
          </div>
          <div className='col-md-2'>
            <a href="https://google.com/" target="_blank" rel="noreferrer noopener" className='link-text'>
              SUPPORT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
