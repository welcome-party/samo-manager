import React from 'react';
import { useHistory } from 'react-router-dom';
import { useState, useEffect } from "react";

import { Connection, PublicKey } from '@solana/web3.js';
import {
    Program, Provider
} from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';

import idl from '../idl/samo_manager.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const clusterUrl = process.env.REACT_APP_CLUSTER_URL;
const mintPublicKey = process.env.REACT_APP_SAMO_MINT ? new PublicKey(process.env.REACT_APP_SAMO_MINT) : new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
const wallets = [getPhantomWallet()];
const opts = { preflightCommitment: "processed" };
const programID = new PublicKey(idl.metadata.address);

function ListVouchers() {
    const wallet = useWallet();
    const history = useHistory();
    const [vouchers, setVouchers] = useState([]);

    async function listVouchers() {
        try {
            const connection = new Connection(clusterUrl, opts.preflightCommitment);
            const provider = new Provider(connection, wallet, opts.preflightCommitment);
            const program = new Program(idl, programID, provider);

            setVouchers(await program.account.voucherAccount.all());
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            setVouchers(null);
            history.push('/');
        }
    }

    async function cancelVoucher(voucherKey) {
        try {
            const connection = new Connection(clusterUrl, opts.preflightCommitment);
            const provider = new Provider(connection, wallet, opts.preflightCommitment);
            const program = new Program(idl, programID, provider);

            const voucherAccount = await program.account.voucherAccount.fetch(voucherKey);
            const mintToken = new Token(connection, mintPublicKey, TOKEN_PROGRAM_ID);
            const vaultAccountSeed = new Uint8Array(voucherAccount.vaultAccountSeed);
            const vaultAuthoritySeed = anchor.utils.bytes.utf8.encode("voucher");

            const senderTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(provider.wallet.publicKey);
            const [vaultAccountPda] = await PublicKey.findProgramAddress([Buffer.from(vaultAccountSeed)], program.programId);
            const [vaultAuthorityPda] = await PublicKey.findProgramAddress([Buffer.from(vaultAuthoritySeed)], program.programId);

            await program.rpc.cancelVoucher(
                {
                    accounts: {
                        sender: provider.wallet.publicKey,
                        senderTokenAccount: senderTokenAccount.address,
                        vaultAccount: vaultAccountPda,
                        vaultAuthority: vaultAuthorityPda,
                        voucherAccount: new PublicKey(voucherKey),
                        tokenProgram: TOKEN_PROGRAM_ID,
                    }
                }
            );

            listVouchers();
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            setVouchers(null);
            history.push('/');
        }
    }

    useEffect(() => {
        listVouchers();
    }, []);


    return (
        <div className='content'>
            <div className='row'>&nbsp;</div><div className='row'>&nbsp;</div>
            <div className='row'>
                <div className='col-md-6 large-text'>
                    Connect to your wallet to Cancel any vouchers:
                </div>
                <div className='col-md-6 d-flex'>
                    <WalletMultiButton />
                </div>
            </div>
            <div className='row'>&nbsp;</div><div className='row'>&nbsp;</div>
            <div className='row'>
                <div className='col'>
                    <table class="table medium-text align-middle">
                        <thead>
                            <tr>
                                <th scope="col">Voucher Key</th>
                                <th scope="col">$SAMO</th>
                                <th scope="col">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.map((voucher, key) =>
                                <tr>
                                    <td>{voucher.publicKey.toString()}</td>
                                    <td>{voucher.account.tokenCount.toString()}</td>
                                    <td>
                                        {
                                            wallet.connected && (wallet.publicKey.toString() === voucher.account.senderKey.toString()) &&
                                            <input type="button" disabled={!wallet.connected} className='button p-2 medium-text' value='Cancel' onClick={() => cancelVoucher(voucher.publicKey.toString())} />
                                        }
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>

                </div>
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
