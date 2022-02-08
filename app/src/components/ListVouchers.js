import React from 'react';
import { useHistory } from 'react-router-dom';
import { useState, useEffect } from "react";

import { Connection, PublicKey } from '@solana/web3.js';
import {
    Program, Provider
} from '@project-serum/anchor';
import idl from '../idl/samo_manager.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './ListVouchers.css';

const clusterUrl = process.env.REACT_APP_CLUSTER_URL;
const wallets = [getPhantomWallet()];
const opts = { preflightCommitment: "processed" };
const programID = new PublicKey(idl.metadata.address);

function ListVouchers() {
    const wallet = useWallet();
    const history = useHistory();
    const [vouchers, setVouchers] = useState([]);

    async function listVouchers() {
        const connection = new Connection(clusterUrl, opts.preflightCommitment);
        const provider = new Provider(connection, wallet, opts.preflightCommitment);
        const program = new Program(idl, programID, provider);

        try {
            console.log(await program.account.voucherAccount.all());
            setVouchers(await program.account.voucherAccount.all());
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            history.push('/');
        }
    }

    async function cancelVoucher(voucherKey) {
        alert(voucherKey);
    }

    useEffect(() => {
        listVouchers();
    }, []);


    return (
        <div className='content'>
            <div><WalletMultiButton /></div>
            <div className='list-area'>
                {vouchers.map((voucher, key) => <div key={key} className='list-item medium-text'>
                    Voucher: {voucher.publicKey.toString()} &nbsp;
                    $SAMO: {voucher.account.tokenCount.toString()} &nbsp;
                    {
                        wallet.connected && (wallet.publicKey.toString() === voucher.account.senderKey.toString()) &&
                        <input type="button" disabled={!wallet.connected} className='cancel-voucher-button medium-text' value='Cancel' onClick={() => cancelVoucher(voucher.publicKey.toString())}/>
                    }
                </div>)}
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
