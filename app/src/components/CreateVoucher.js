import React from 'react';
import { useHistory } from 'react-router-dom';
import { useState } from "react";

import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {
    Program, Provider
} from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import idl from '../idl/samo_manager.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import './WalletAdaptor.css';
import WelcomePartyInfo from './WelcomePartyInfo.js';
import successLogo from '../assets/success_logo.png';
import { truncateBase58, copyToClipBoard } from '../Helpers.js';
import copyLogo from '../assets/copy.png';

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
    const [voucherKey, setVoucherKey] = useState("");

    async function createVoucher(event) {
        event.preventDefault();

        try {
            const voucherAccount = Keypair.generate();
            const vaultAccountSeed = anchor.utils.bytes.utf8.encode(Date.now() + '');

            const connection = new Connection(clusterUrl, opts.preflightCommitment);
            const provider = new Provider(connection, wallet, opts.preflightCommitment);
            const program = new Program(idl, programID, provider);

            const mintToken = new Token(connection, mintPublicKey, TOKEN_PROGRAM_ID);

            const senderTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(provider.wallet.publicKey);
            const [vaultAccountPda, vaultAccountBump] = await PublicKey.findProgramAddress([Buffer.from(vaultAccountSeed)], program.programId);

            await program.rpc.createVoucher(
                vaultAccountSeed,
                vaultAccountBump,
                new anchor.BN(tokenCount),
                {
                    accounts: {
                        mint: mintPublicKey,
                        sender: provider.wallet.publicKey,
                        senderTokenAccount: senderTokenAccount.address,
                        vaultAccount: vaultAccountPda,
                        voucherAccount: voucherAccount.publicKey,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    },
                    instructions: [
                        await program.account.voucherAccount.createInstruction(voucherAccount),
                    ],
                    signers: [voucherAccount],
                }
            );

            const voucher = await program.account.voucherAccount.fetch(voucherAccount.publicKey);
            if (voucher) {
                setVoucherKey(voucherAccount.publicKey.toString());
                setVoucher(voucher);
            }
        } catch (err) {
            console.log("Transaction Error: ", err);
            alert('Tranaction Error:' + err);
            setVoucher(null);
            setVoucherKey(null);
            history.push('/');
        }
    }

    return (
        <div className='content row'>
            <div className='col-md-6'>
                <WelcomePartyInfo />
            </div>
            <div className='col-md-6'>
                <div className='input-area'>
                    <div className='row'>&nbsp;</div>
                    <div className='row'>
                        <div className='col-md-4'>&nbsp;</div>
                        <div className='col-md-4'>
                            <WalletMultiButton />
                        </div>
                        <div className='col-md-4'>&nbsp;</div>
                    </div>
                    <div className='row'>&nbsp;</div>
                    {
                        voucher &&
                        <div className='row'>
                            <div className='col'>
                                <div className='row'>
                                    <div className='col'><img src={successLogo} className="img-fluid" alt='Success'></img></div>
                                </div>
                                <div className='row'>
                                    <div className='col large-text'>Success! Here's your unique share link:</div>
                                </div>
                                <div className='row'>&nbsp;</div>
                                <div className='row'>
                                    <div className='col-md-9 share-link-field share-link-text'>{window.location.origin}/accept-voucher?voucherKey={truncateBase58(voucherKey)}</div>
                                    <div className='col-md-2 d-flex'><button className="btn btn-link" onClick={() => copyToClipBoard(window.location.origin + '/accept-voucher?voucherKey=' + voucherKey)}><img src={copyLogo} className='img-fluid' alt='Copy'></img></button></div>
                                </div>
                                <div className='row'>&nbsp;</div>
                                <div className='row'>
                                    <div className='col medium-text'>Once your friend installs Phantom...</div>
                                </div>
                                <div className='row'>&nbsp;</div><div className='row'>&nbsp;</div>
                            </div>
                        </div>
                    }
                    {
                        !voucher &&
                        <div className='row'>
                            <div className='col'>
                                <form onSubmit={createVoucher}>
                                    <div className='row'>
                                        <div className='col-md-6'>
                                            <div className='large-text'> $SAMO to send</div>
                                        </div>
                                        <div className='col-md-6'>
                                            <label><input type="number" value={tokenCount} onChange={(e) => setTokenCount(e.target.value)} required className='input-field large-text' /></label>
                                        </div>
                                    </div>
                                    <div className='row'>&nbsp;</div><div className='row'>&nbsp;</div>
                                    <div className='row'>
                                        <div className='col'>
                                            <input type="submit" disabled={!wallet.connected} className='button w-50 p-3 large-text' value='Send SAMO!' />
                                        </div>
                                    </div>
                                    <div className='row'>&nbsp;</div><div className='row'>&nbsp;</div>
                                </form>
                            </div>
                        </div>
                    }
                </div>
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