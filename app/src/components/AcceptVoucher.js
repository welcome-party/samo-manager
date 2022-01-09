import React from 'react';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from "react";
import { Connection, PublicKey } from '@solana/web3.js';
import {
    Program, Provider
} from '@project-serum/anchor';
import idl from '../idl/samo_manager.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import './AcceptVoucher.css';
import WelcomePartyInfo from './subcomponents/WelcomePartyInfo.js';

const clusterUrl = process.env.REACT_APP_CLUSTER_URL;

const wallets = [
    /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
    getPhantomWallet()
]

const opts = {
    preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);

function AcceptVoucher() {
    const search = useLocation().search;
    const voucherAccount = new URLSearchParams(search).get('voucherAccount');

    const wallet = useWallet();
    const [voucher, setVoucher] = useState([]);

    async function getProvider() {
        const connection = new Connection(clusterUrl, opts.preflightCommitment);

        const provider = new Provider(
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    async function getVoucher() {
        const provider = await getProvider()
        const program = new Program(idl, programID, provider);
        try {
            const voucherReturned = await program.account.voucher.fetch(new PublicKey(voucherAccount));
            if (voucherReturned) {
                // TODO logic for voucher expiry
                setVoucher(voucherReturned);
            }
        } catch (err) {
            console.log("Transaction Error: ", err);
            setVoucher(null);
        }
    }

    useEffect(() => {
        getVoucher();
    }, []);


    return (
        <div className='content'>
            <WelcomePartyInfo />
            {
                !voucher && <div className='input-area'>Invalid Voucher</div>
            }
            {
                voucher && <div className='input-area'> Valid Voucher {voucher.fromName}</div>
            }

        </div>
    );
}

const AcceptVoucherWithProvider = () => (
    <ConnectionProvider endpoint={clusterUrl}>
        <WalletProvider wallets={wallets}>
            <WalletModalProvider>
                <AcceptVoucher />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
)

export default AcceptVoucherWithProvider;
