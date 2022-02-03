import React from 'react';
import { useHistory } from 'react-router-dom';
import { useState } from "react";

import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, Keypair } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {
    Program, Provider
} from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import idl from '../idl/samo_manager.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import './SendVoucher.css';
import './WalletAdaptor.css';
import WelcomePartyInfo from './subcomponents/WelcomePartyInfo.js';

const clusterUrl = process.env.REACT_APP_CLUSTER_URL;
const wallets = [getPhantomWallet()];
const opts = { preflightCommitment: "processed" };
const programID = new PublicKey(idl.metadata.address);

function SendVoucher() {
    const wallet = useWallet();
    const history = useHistory();

    const [fromName, setFromName] = useState("");
    const [toName, setToName] = useState("");
    const [tokenCount, setTokenCount] = useState("");
    const [voucher, setVoucher] = useState("");
    // const validDays = 5;

    async function sendVoucher(event) {
        event.preventDefault();

        const escrowAccount = Keypair.generate();
        const initializerMainAccount = Keypair.generate();
        
        const seed = Date.now() + '';
        
        const connection = new Connection(clusterUrl, opts.preflightCommitment);
        const provider = new Provider(connection, wallet, opts.preflightCommitment);
        const program = new Program(idl, programID, provider);

        const mintPublicKey = new PublicKey("Hc5orha85LpZCAWJM18WHBp2bBp4uFznKuzkWpfjkmkG");
        const mintToken = new Token(connection, mintPublicKey, TOKEN_PROGRAM_ID);
        const instructions = [];

        try {
            const senderWalletTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(provider.wallet.publicKey);

            const initializerTokenAddr = await Token.getAssociatedTokenAddress(
                mintToken.associatedProgramId,
                mintToken.programId,
                mintPublicKey,
                initializerMainAccount.publicKey
            );

            const initializerTokenAccount = await connection.getAccountInfo(initializerTokenAddr);

            if (initializerTokenAccount === null) {
                instructions.push(
                    Token.createAssociatedTokenAccountInstruction(
                        mintToken.associatedProgramId,
                        mintToken.programId,
                        mintPublicKey,
                        initializerTokenAddr,
                        initializerMainAccount.publicKey,
                        provider.wallet.publicKey
                    )
                )
            }

            instructions.push(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    senderWalletTokenAccount.address,
                    initializerTokenAddr,
                    provider.wallet.publicKey,
                    [],
                    tokenCount
                )
            );

            const transaction = new Transaction().add(...instructions);
            transaction.feePayer = provider.wallet.publicKey;
            transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
            await provider.wallet.signTransaction(transaction);

            const transactionSignature = await connection.sendRawTransaction(transaction.serialize(),
                { skipPreflight: true }
            );

            await connection.confirmTransaction(transactionSignature);

            const [vault_account_pda, vault_account_bump] = await PublicKey.findProgramAddress(
                [Buffer.from(anchor.utils.bytes.utf8.encode(seed))],
                program.programId
            );

            console.log('Starting');
            await program.rpc.initialize(
                seed,
                vault_account_bump,
                new anchor.BN(tokenCount),
                new anchor.BN(tokenCount),
                {
                    accounts: {
                        initializer: initializerMainAccount.publicKey,
                        vaultAccount: vault_account_pda,
                        mint: mintToken.publicKey,
                        initializerDepositTokenAccount: initializerTokenAddr,
                        initializerReceiveTokenAccount: initializerTokenAddr,
                        escrowAccount: escrowAccount.publicKey,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    instructions: [
                        await program.account.escrowAccount.createInstruction(escrowAccount),
                    ],
                    signers: [escrowAccount, initializerMainAccount],
                }
            );

            const escrow = await program.account.escrowAccount.fetch(escrowAccount.publicKey);
            if (escrow) {
                setVoucher(escrow);
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
                        <div className='share-link-field share-link-text'>{window.location.href}accept-voucher?voucherAccount={voucher.publicKey.toBase58()}</div>
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