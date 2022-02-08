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

import './CreateVoucher.css';
import './WalletAdaptor.css';
import WelcomePartyInfo from './subcomponents/WelcomePartyInfo.js';

const clusterUrl = process.env.REACT_APP_CLUSTER_URL;
const mintPublicKey = process.env.REACT_APP_SAMO_MINT ? new PublicKey(process.env.REACT_APP_SAMO_MINT) : new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
const wallets = [getPhantomWallet()];
const opts = { preflightCommitment: "processed" };
const programID = new PublicKey(idl.metadata.address);

function CreateVoucher() {
    const wallet = useWallet();
    const history = useHistory();

    const [tokenCount, setTokenCount] = useState("");
    const [voucher, setVoucher] = useState("");

    async function createVoucher(event) {
        event.preventDefault();

        const voucherAccount = Keypair.generate();
        const senderAccount = Keypair.generate();

        const vaultAccountSeed = Date.now() + '';

        const connection = new Connection(clusterUrl, opts.preflightCommitment);
        const provider = new Provider(connection, wallet, opts.preflightCommitment);
        const program = new Program(idl, programID, provider);

        const mintToken = new Token(connection, mintPublicKey, TOKEN_PROGRAM_ID);
        const instructions = [];

        try {
            const senderWalletTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(provider.wallet.publicKey);

            const senderTokenAddr = await Token.getAssociatedTokenAddress(
                mintToken.associatedProgramId,
                mintToken.programId,
                mintPublicKey,
                senderAccount.publicKey
            );

            const senderTokenAccount = await connection.getAccountInfo(senderTokenAddr);

            if (senderTokenAccount === null) {
                instructions.push(
                    Token.createAssociatedTokenAccountInstruction(
                        mintToken.associatedProgramId,
                        mintToken.programId,
                        mintPublicKey,
                        senderTokenAddr,
                        senderAccount.publicKey,
                        provider.wallet.publicKey
                    )
                )
            }

            instructions.push(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    senderWalletTokenAccount.address,
                    senderTokenAddr,
                    provider.wallet.publicKey,
                    [],
                    tokenCount
                )
            );

            instructions.push(
                SystemProgram.transfer({
                    fromPubkey: provider.wallet.publicKey,
                    toPubkey: senderAccount.publicKey,
                    lamports: 1000000000,
                })
            );

            const transaction = new Transaction().add(...instructions);
            transaction.feePayer = provider.wallet.publicKey;
            transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
            await provider.wallet.signTransaction(transaction);

            const transactionSignature = await connection.sendRawTransaction(transaction.serialize(),
                { skipPreflight: true }
            );

            await connection.confirmTransaction(transactionSignature);

            const [vault_account_pda, vaultAccountBump] = await PublicKey.findProgramAddress(
                [Buffer.from(anchor.utils.bytes.utf8.encode(vaultAccountSeed))],
                program.programId
            );

            await program.rpc.createVoucher(
                vaultAccountSeed,
                vaultAccountBump,
                new anchor.BN(tokenCount),
                {
                    accounts: {
                        sender: senderAccount.publicKey,
                        vaultAccount: vault_account_pda,
                        mint: mintPublicKey,
                        senderTokenAccount: senderTokenAddr,
                        voucherAccount: voucherAccount.publicKey,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    instructions: [
                        await program.account.voucherAccount.createInstruction(voucherAccount),
                    ],
                    signers: [voucherAccount, senderAccount],
                }
            );

            const voucher = await program.account.voucherAccount.fetch(voucherAccount.publicKey);
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
                        {/* <div className='share-link-field share-link-text'>{window.location.href}accept-voucher?voucherAccount={voucher.publicKey.toBase58()}</div> */}
                        <div className='friend-installs-message medium-text'>Once your friend installs Phantom...</div>
                    </div>
                }
                {
                    !voucher && <form onSubmit={createVoucher}>
                        <div className='large-text samo-to-send-text'> $SAMO to send</div>
                        <label><input type="number" value={tokenCount} onChange={(e) => setTokenCount(e.target.value)} required className='input-field samo-to-send-input large-text' /></label>

                        <input type="submit" disabled={!wallet.connected} className='send-samo-button large-text' value='Send SAMO!' />
                    </form>

                }
            </div>
        </div>
    );
}

const CreateVoucherWithProvider = () => (
    <ConnectionProvider endpoint={clusterUrl}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <CreateVoucher />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
)

export default CreateVoucherWithProvider;