import React from 'react';
import { useHistory } from 'react-router-dom';
import { useState } from "react";

import { Connection, PublicKey } from '@solana/web3.js';
import {
    Program, Provider, web3
} from '@project-serum/anchor';
import idl from '../idl/samo_manager.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './SendVoucher.css';
import './WalletAdaptor.css';
import WelcomePartyInfo from './subcomponents/WelcomePartyInfo.js';

const clusterUrl = process.env.REACT_APP_CLUSTER_URL;

const wallets = [
    /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
    getPhantomWallet()
]

const { SystemProgram, Keypair } = web3;

/* create an account  */
const voucherAccount = Keypair.generate();

const opts = {
    preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);

function SendVoucher() {
    const wallet = useWallet();
    const history = useHistory();

    const [fromName, setFromName] = useState("");
    const [toName, setToName] = useState("");
    const [tokenCount, setTokenCount] = useState("");
    const [voucher, setVoucher] = useState("");
    const validDays = 5;

    async function getProvider() {
        const connection = new Connection(clusterUrl, opts.preflightCommitment);

        const provider = new Provider(
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    async function sendVoucher(event) {
        event.preventDefault();

        const provider = await getProvider()
        const program = new Program(idl, programID, provider);

        try {
            await program.rpc.sendVoucher(fromName, toName, tokenCount, validDays, {
                accounts: {
                    voucher: voucherAccount.publicKey,
                    sender: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [voucherAccount]
            });

            const voucher = await program.account.voucher.fetch(voucherAccount.publicKey);
            if (voucher) {
                setVoucher(voucher);
            }
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            history.push('/');
        }
    }

    return (
        <div className='content'>
            <WelcomePartyInfo />
            <div className='input-area'>
                <div className='sender-wallet-connect-button'><WalletMultiButton /></div>
                {
                    voucher && <div>
                        <img src={require('../assets/success_logo.png')} className='success-logo' alt='Success'></img>
                        <div className='success-message large-text'>Success! Here’s your unique share link:</div>
                        <div className='share-link-field share-link-text'>https://welcome-party.netlify.app/accept-voucher?voucherAccount={voucherAccount.publicKey.toBase58()}</div>
                        <div className='friend-installs-message medium-text'>Once your friend installs Phantom...</div>
                    </div>
                }
                {
                    !voucher && <form onSubmit={sendVoucher}>
                        <div className='large-text your-name-text'> Your name</div>
                        <label><input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} required className='input-field your-name-input large-text' /></label>
                        <div className='large-text recipient-name-text'> Recipient's name</div>
                        <label><input type="text" value={toName} onChange={(e) => setToName(e.target.value)} required className='input-field recipient-name-input large-text' /></label>
                        <div className='large-text samo-to-send-text'> $SAMO to send</div>
                        <label><input type="number" value={tokenCount} onChange={(e) => setTokenCount(e.target.value)} required className='input-field samo-to-send-input large-text' /></label>

                        <input type="submit" disabled={!wallet.connected} className='send-samo-button large-text' value='Send SAMO!' />
                    </form>

                }
            </div>
        </div>
    );
}

const SendVoucherWithProvider = () => (
    <ConnectionProvider endpoint={clusterUrl}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <SendVoucher />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
)

export default SendVoucherWithProvider;