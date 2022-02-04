import React from 'react';
import { useHistory } from 'react-router-dom';
import { useState, useEffect } from "react";

import * as anchor from '@project-serum/anchor';

import { Connection, PublicKey } from '@solana/web3.js';
import {
    Program, Provider
} from '@project-serum/anchor';
import idl from '../idl/samo_manager.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import './ListVouchers.css';

const clusterUrl = process.env.REACT_APP_CLUSTER_URL;

const wallets = [
    /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
    getPhantomWallet()
]

const opts = {
    preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);

function ListVouchers() {
    const wallet = useWallet();
    const history = useHistory();
    const [vouchers, setVouchers] = useState([]);

    async function getProvider() {
        const connection = new Connection(clusterUrl, opts.preflightCommitment);

        const provider = new Provider(
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    async function listVouchers() {
        const provider = await getProvider()
        const program = new Program(idl, programID, provider);

        try {
            const vouchers = await program.account.voucherAccount.all();
            console.log(vouchers);
            setVouchers(await program.account.voucherAccount.all());
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            history.push('/');
        }
    }

    useEffect(() => {
        listVouchers();
    }, []);


    return (
        <div className='content'>
            <div className='list-area'>
                {vouchers.map((voucher, key) => <div key={key} className='medium-text'>Voucher Key: {voucher.publicKey.toString()} &nbsp; Sender: {voucher.account.senderKey.toString()} &nbsp;$SAMO: {voucher.account.tokenCount.toString()} </div>)}
            </div>
        </div>
    );
}

const ListVouchersWithProvider = () => (
    <ConnectionProvider endpoint={clusterUrl}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <ListVouchers />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
)

export default ListVouchersWithProvider;
