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

    const [fromEmail, setFromEmail] = useState("");
    const [toEmail, setToEmail] = useState("");
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
            await program.rpc.sendVoucher(fromEmail, toEmail, tokenCount, validDays, {
                accounts: {
                    voucher: voucherAccount.publicKey,
                    sender: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [voucherAccount]
            });

            const voucher = await program.account.voucherAccount.fetch(voucherAccount.publicKey);
            console.log('voucher: ', voucher);

            // Send email

            alert('Successfully created voucher and sent email');

            history.push('/home');
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            history.push('/home');
        }
    }

    return (
        <div className='Content'>
            <form onSubmit={sendVoucher}>
                From: <label><input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} required/></label> <br /><br />
                Hi <label><input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} required/></label>,<br /><br />
                I want to send you <label><input type="number" value={tokenCount} onChange={(e) => setTokenCount(e.target.value)} required/></label> SAMO tokens. SAMO is the ambassador to the Solana ecosystem and is here to help you get on board.<br /><br />
                To receive your tokens, just click on the link below to install a wallet. Once installed, the tokens will be there in your wallet. From there we'll show you all the amazing things you can do with them.<br /><br />

                <a href='https://welcome-party.netlify.app/accept-voucher?voucher=xxx'>Install Wallet and Inform sender</a><br /><br />

                Welcome to Solana!<br /><br /><br /><br />
                {
                    !wallet.connected && <WalletMultiButton />
                }
                {
                    wallet.connected && <input type="submit" />
                }
            </form>
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
