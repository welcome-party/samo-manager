const assert = require("assert");
const anchor = require("@project-serum/anchor");

describe('samo-manager', () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());
    const program = anchor.workspace.SamoManager;

    it('can send a voucher', async () => {
        const voucher = anchor.web3.Keypair.generate();
        await program.rpc.sendVoucher('a@a.com', 'b@b.com', 2, 3, {
            accounts: {
                voucher: voucher.publicKey,
                sender: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [voucher],
        });

        // Fetch the account details of the created voucher.
        const voucherAccount = await program.account.voucher.fetch(voucher.publicKey);

        // Ensure it has the right data.
        assert.equal(voucherAccount.sender.toBase58(), program.provider.wallet.publicKey.toBase58());
        assert.equal(voucherAccount.fromName, 'a@a.com');
        assert.equal(voucherAccount.toName, 'b@b.com');
        assert.equal(voucherAccount.tokenCount, 2);
        assert.equal(voucherAccount.validDays, 3);
        assert.ok(voucherAccount.timestamp);
    });

    it('can send a new voucher from a different sender', async () => {
        // Generate another user and airdrop them some SOL.
        const otherUser = anchor.web3.Keypair.generate();
        const signature = await program.provider.connection.requestAirdrop(otherUser.publicKey, 1000000000);
        await program.provider.connection.confirmTransaction(signature);

        // Call the "sendVoucher" instruction on behalf of this other user.
        const voucher = anchor.web3.Keypair.generate();
        await program.rpc.sendVoucher('ab@ab.com', 'blah@blah.com', 5, 2, {
            accounts: {
                voucher: voucher.publicKey,
                sender: otherUser.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            },
            signers: [otherUser, voucher],
        });

        // Fetch the account details of the created voucher.
        const voucherAccount = await program.account.voucher.fetch(voucher.publicKey);

        // Ensure it has the right data.
        assert.equal(voucherAccount.sender.toBase58(), otherUser.publicKey.toBase58());
        assert.equal(voucherAccount.fromName, 'ab@ab.com');
        assert.equal(voucherAccount.toName, 'blah@blah.com');
        assert.equal(voucherAccount.tokenCount,5);
        assert.equal(voucherAccount.validDays, 2);
        assert.ok(voucherAccount.timestamp);
    });

    it('cannot provide a fromName with more than 200 characters', async () => {
        try {
            const voucher = anchor.web3.Keypair.generate();
            const nameWith201Chars = 'x'.repeat(201);
            await program.rpc.sendVoucher(nameWith201Chars, 'b@b.com', 2, 3, {
                accounts: {
                    voucher: voucher.publicKey,
                    sender: program.provider.wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
                signers: [voucher],
            });
        } catch (error) {
            assert.equal(error.msg, 'The provided name should be 200 characters long maximum.');
            return;
        }

        assert.fail('The instruction should have failed with a 201-character fromName.');
    });

    it('cannot provide a toName with more than 200 characters', async () => {
        try {
            const voucher = anchor.web3.Keypair.generate();
            const nameWith201Chars = 'x'.repeat(201);
            await program.rpc.sendVoucher('a@a.com', nameWith201Chars, 2, 3, {
                accounts: {
                    voucher: voucher.publicKey,
                    sender: program.provider.wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                },
                signers: [voucher],
            });
        } catch (error) {
            assert.equal(error.msg, 'The provided name should be 200 characters long maximum.');
            return;
        }

        assert.fail('The instruction should have failed with a 201-character toName.');
    });

    it('can fetch all vouchers', async () => {
        const voucherAccounts = await program.account.voucher.all();
        assert.equal(voucherAccounts.length, 2);
    });

    it('can filter vouchers by sender', async () => {
        const senderPublicKey = program.provider.wallet.publicKey
        const voucherAccounts = await program.account.voucher.all([
            {
                memcmp: {
                    offset: 8, // Discriminator.
                    bytes: senderPublicKey.toBase58(),
                }
            }
        ]);

        assert.equal(voucherAccounts.length, 1);
        assert.ok(voucherAccounts.every(voucherAccount => {
            return voucherAccount.account.sender.toBase58() === senderPublicKey.toBase58()
        }))
    });
});
