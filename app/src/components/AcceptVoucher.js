import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useState, useEffect } from "react";

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
    Program, Provider
} from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import * as anchor from '@project-serum/anchor';

import idl from '../idl/samo_manager.json';

import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import './AcceptVoucher.css';
import './WalletAdaptor.css';
import WelcomePartyInfo from './subcomponents/WelcomePartyInfo.js';

const clusterUrl = process.env.REACT_APP_CLUSTER_URL;
const mintPublicKey = process.env.REACT_APP_SAMO_MINT ? new PublicKey(process.env.REACT_APP_SAMO_MINT) : new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
const wallets = [getPhantomWallet()];
const opts = { preflightCommitment: "processed" };
const programID = new PublicKey(idl.metadata.address);

function AcceptVoucher() {
    const search = useLocation().search;
    const voucherKey = new URLSearchParams(search).get('voucherKey');

    const wallet = useWallet();
    const history = useHistory();

    const [voucher, setVoucher] = useState("");

    async function fetchVoucher() {
        try {
            const connection = new Connection(clusterUrl, opts.preflightCommitment);
            const provider = new Provider(connection, wallet, opts.preflightCommitment);
            const program = new Program(idl, programID, provider);

            setVoucher(await program.account.voucherAccount.fetch(voucherKey));
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            setVoucher(null);
            history.push('/');
        }
    }

    async function acceptVoucher(event) {
        event.preventDefault();

        try {
            const connection = new Connection(clusterUrl, opts.preflightCommitment);
            const provider = new Provider(connection, wallet, opts.preflightCommitment);
            const program = new Program(idl, programID, provider);

            const voucherAccount = await program.account.voucherAccount.fetch(voucherKey);
            const mintToken = new Token(connection, mintPublicKey, TOKEN_PROGRAM_ID);
            const vaultAccountSeed = new Uint8Array(voucherAccount.vaultAccountSeed);
            const vaultAuthoritySeed = anchor.utils.bytes.utf8.encode("voucher");

            // const receiverTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(provider.wallet.publicKey);

            const receiverTokenAccountAddr = await Token.getAssociatedTokenAddress(
                mintToken.associatedProgramId,
                mintToken.programId,
                mintPublicKey,
                provider.wallet.publicKey
            );

            const receiverTokenAccount = await connection.getAccountInfo(receiverTokenAccountAddr);

            const instructions = [];

            if (receiverTokenAccount === null) {
                instructions.push(
                    Token.createAssociatedTokenAccountInstruction(
                        mintToken.associatedProgramId,
                        mintToken.programId,
                        mintPublicKey,
                        receiverTokenAccountAddr,
                        provider.wallet.publicKey,
                        provider.wallet.publicKey
                    )
                )

                const transaction = new Transaction().add(...instructions);
                transaction.feePayer = provider.wallet.publicKey;
                transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
                await provider.wallet.signTransaction(transaction);
    
                const transactionSignature = await connection.sendRawTransaction(transaction.serialize(),
                    { skipPreflight: true }
                );
                await connection.confirmTransaction(transactionSignature);    
            }


            const [vaultAccountPda] = await PublicKey.findProgramAddress([Buffer.from(vaultAccountSeed)], program.programId);
            const [vaultAuthorityPda] = await PublicKey.findProgramAddress([Buffer.from(vaultAuthoritySeed)], program.programId);

            await program.rpc.acceptVoucher(
                {
                    accounts: {
                        receiver: provider.wallet.publicKey,
                        receiverTokenAccount: receiverTokenAccountAddr,
                        sender: voucherAccount.senderKey,
                        senderTokenAccount: voucherAccount.senderTokenAccount,
                        vaultAccount: vaultAccountPda,
                        vaultAuthority: vaultAuthorityPda,
                        voucherAccount: new PublicKey(voucherKey),
                        tokenProgram: TOKEN_PROGRAM_ID,
                    }
                }
            );
            history.push('/');
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            setVoucher(null);
            history.push('/');
        }
    }

    useEffect(() => {
        fetchVoucher();
    }, []);

    return (
        <div className='row'>
            <div className='col-md-6'>
                <WelcomePartyInfo />
            </div>
            {
                !voucher && <div className='col-md-6 input-area large-text'><div className='invalid-message'>Invalid Voucher</div></div>
            }
            {
                voucher && <div className='col-md-6 input-area large-text'>
                    <div className='invite-message'>{voucher.senderKey.toString()} has invited you to join them and get free {voucher.tokenCount.toString()} $SAMO</div>
                    <div className='step1-message-left'>STEP 1</div>
                    <div className='step1-message-right'>Install the Phantom Wallet on your Browser</div>
                    <div className='step2-message-left'>STEP 2</div>
                    <div className='step2-message-right'>
                        {
                            <div className='receiver-wallet-connect-button'><WalletMultiButton /></div>
                        }
                    </div>
                    <div className='step3-message-left'>STEP 3</div>
                    <div className='step3-message-right'><img src={require('../assets/success_logo.png')} className='step3-success-logo' alt='Success'></img></div>
                    <input type="button" disabled={!wallet.connected} className='accept-samo-button large-text' value='Accept SAMO!' onClick={acceptVoucher} />
                </div>
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
