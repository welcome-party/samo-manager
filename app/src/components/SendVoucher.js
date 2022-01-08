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
            console.log('voucher: ', voucher);
            
            alert('Successfully created voucher');

            history.push('/');
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            history.push('/');
        }
    }

    return (
        <div className='content'>
            <span className='welcome-party-logo'></span>
            <div className='samo-moon-message small-text'>Let's get Samo to the moon</div>
            <div className='welcome-party-message large-text'>Welcome party allows you get free $SAMO for onoarding friends onto Phantom</div>
            <div className='backed-by-team-message medium-text'>Backed by the <img src={require('../assets/samo_logo.png')} className='samo-logo' alt='SAMO'></img> team</div>
            <div className='input-area'>
                {
                    !wallet.connected && <WalletMultiButton />
                }
                <form onSubmit={sendVoucher}>
                    <div className='large-text your-name-text'> Your name</div>
                    <label><input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} required className='input-field your-name-input large-text' /></label>
                    <div className='large-text recipient-name-text'> Recipient's name</div>
                    <label><input type="text" value={toName} onChange={(e) => setToName(e.target.value)} required className='input-field recipient-name-input large-text' /></label>
                    <div className='large-text samo-to-send-text'> $SAMO to send</div>
                    <label><input type="number" value={tokenCount} onChange={(e) => setTokenCount(e.target.value)} required className='input-field samo-to-send-input large-text' /></label>

                    <input type="submit" disabled={!wallet.connected} className='send-samo-button large-text' value='Send SAMO!'/>
                </form>
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