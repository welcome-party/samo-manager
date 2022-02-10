use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, SetAuthority, TokenAccount, Transfer};
use spl_token::instruction::AuthorityType;

declare_id!("7W6cQN1gyokmJFDss6zez3CpjAyv5KqRYjPa7bUDEtqK");

#[program]
pub mod samo_manager {
    use super::*;

    const VOUCHER_PDA_SEED: &[u8] = b"voucher";

    pub fn create_voucher(
        ctx: Context<CreateVoucher>,
        _vault_account_seed: [u8; 13],
        _vault_account_bump: u8,
        token_count: u64,
    ) -> ProgramResult {
        ctx.accounts.voucher_account.sender_key = *ctx.accounts.sender.key;
        ctx.accounts.voucher_account.sender_token_account =
            *ctx.accounts.sender_token_account.to_account_info().key;
        ctx.accounts.voucher_account.token_count = token_count;
        ctx.accounts.voucher_account.vault_account_seed = _vault_account_seed;

        let (vault_authority, _vault_authority_bump) =
            Pubkey::find_program_address(&[VOUCHER_PDA_SEED], ctx.program_id);
        token::set_authority(
            ctx.accounts.into_set_authority_context(),
            AuthorityType::AccountOwner,
            Some(vault_authority),
        )?;

        token::transfer(
            ctx.accounts.into_transfer_to_pda_context(),
            ctx.accounts.voucher_account.token_count,
        )?;

        Ok(())
    }

    pub fn cancel_voucher(ctx: Context<CancelVoucher>) -> ProgramResult {
        let (_vault_authority, vault_authority_bump) =
            Pubkey::find_program_address(&[VOUCHER_PDA_SEED], ctx.program_id);
        let authority_seeds = &[&VOUCHER_PDA_SEED[..], &[vault_authority_bump]];

        token::transfer(
            ctx.accounts
                .into_transfer_to_sender_context()
                .with_signer(&[&authority_seeds[..]]),
            ctx.accounts.voucher_account.token_count,
        )?;

        token::close_account(
            ctx.accounts
                .into_close_context()
                .with_signer(&[&authority_seeds[..]]),
        )?;

        Ok(())
    }

    pub fn accept_voucher(ctx: Context<AcceptVoucher>) -> ProgramResult {
        let (_vault_authority, vault_authority_bump) =
            Pubkey::find_program_address(&[VOUCHER_PDA_SEED], ctx.program_id);
        let authority_seeds = &[&VOUCHER_PDA_SEED[..], &[vault_authority_bump]];

        token::transfer(
            ctx.accounts
                .into_transfer_to_receiver_context()
                .with_signer(&[&authority_seeds[..]]),
            ctx.accounts.voucher_account.token_count,
        )?;

        token::close_account(
            ctx.accounts
                .into_close_context()
                .with_signer(&[&authority_seeds[..]]),
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(vault_account_seed: [u8; 13], vault_account_bump: u8, token_count: u64)]
pub struct CreateVoucher<'info> {
    #[account(mut, signer)]
    pub sender: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
    init,
    seeds = [&vault_account_seed],
    bump = vault_account_bump,
    payer = sender,
    token::mint = mint,
    token::authority = sender,
    )]
    pub vault_account: Account<'info, TokenAccount>,
    #[account(
    mut,
    constraint = sender_token_account.amount >= token_count
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(zero)]
    pub voucher_account: Box<Account<'info, VoucherAccount>>,
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CancelVoucher<'info> {
    #[account(mut, signer)]
    pub sender: AccountInfo<'info>,
    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    pub vault_authority: AccountInfo<'info>,
    #[account(mut)]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(
    mut,
    constraint = voucher_account.sender_key == * sender.key,
    constraint = voucher_account.sender_token_account == * sender_token_account.to_account_info().key,
    close = sender
    )]
    pub voucher_account: Box<Account<'info, VoucherAccount>>,
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AcceptVoucher<'info> {
    #[account(signer)]
    pub receiver: AccountInfo<'info>,
    #[account(mut)]
    pub receiver_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub sender: AccountInfo<'info>,
    #[account(
    mut,
    constraint = voucher_account.token_count > 0,
    constraint = voucher_account.sender_token_account == * sender_token_account.to_account_info().key,
    constraint = voucher_account.sender_key == * sender.key,
    close = sender
    )]
    pub voucher_account: Box<Account<'info, VoucherAccount>>,
    #[account(mut)]
    pub vault_account: Account<'info, TokenAccount>,
    pub vault_authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}

#[account]
pub struct VoucherAccount {
    pub sender_key: Pubkey,
    pub sender_token_account: Pubkey,
    pub token_count: u64,
    pub vault_account_seed: [u8; 13],
}

impl<'info> CreateVoucher<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.sender_token_account.to_account_info().clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.sender.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.sender.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

impl<'info> CancelVoucher<'info> {
    fn into_transfer_to_sender_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_account.to_account_info().clone(),
            to: self.sender_token_account.to_account_info().clone(),
            authority: self.vault_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_close_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_accounts = CloseAccount {
            account: self.vault_account.to_account_info().clone(),
            destination: self.sender.clone(),
            authority: self.vault_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

impl<'info> AcceptVoucher<'info> {
    fn into_transfer_to_receiver_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.vault_account.to_account_info().clone(),
            to: self.receiver_token_account.to_account_info().clone(),
            authority: self.vault_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_close_context(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_accounts = CloseAccount {
            account: self.vault_account.to_account_info().clone(),
            destination: self.sender.clone(),
            authority: self.vault_authority.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}
