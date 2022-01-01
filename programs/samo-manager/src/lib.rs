use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("FBRbWS9VGhfBZYaNP1vxKMq1wdn62RPC3XzcCHkF4D7G");

#[program]
pub mod samo_manager {
    use super::*;

    pub fn send_voucher(ctx: Context<SendVoucher>, from_email: String, to_email: String, token_count: i16, valid_days: i16) -> ProgramResult {
        let voucher: &mut Account<Voucher> = &mut ctx.accounts.voucher;
        let sender: &Signer = &ctx.accounts.sender;
        let clock: Clock = Clock::get().unwrap();

        if from_email.chars().count() > 200 {
            return Err(ErrorCode::EmailTooLong.into());
        }

        if to_email.chars().count() > 200 {
            return Err(ErrorCode::EmailTooLong.into());
        }

        if token_count <= 0 {
            return Err(ErrorCode::InvalidTokenCount.into());
        }

        if valid_days <= 0 {
            return Err(ErrorCode::InvalidValidForDays.into());
        }

        voucher.sender = *sender.key;
        voucher.timestamp = clock.unix_timestamp;
        voucher.from_email = from_email;
        voucher.to_email = to_email;
        voucher.token_count = token_count;
        voucher.valid_days = valid_days;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SendVoucher<'info> {
    #[account(init, payer = sender, space = Voucher::LEN)]
    pub voucher: Account<'info, Voucher>,
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[account]
pub struct Voucher {
    pub sender: Pubkey,
    pub timestamp: i64,
    pub from_email: String,
    pub to_email: String,
    pub token_count: i16,
    pub valid_days: i16,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4;
// Stores the size of the string.
const MAX_FROM_EMAIL_LENGTH: usize = 200 * 4;
// 200 chars max.
const MAX_TO_EMAIL_LENGTH: usize = 200 * 4;
// 200 chars max.
const TOKEN_COUNT_LENGTH: usize = 2;
const VALID_DAYS_LENGTH: usize = 2;

impl Voucher {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Sender.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_FROM_EMAIL_LENGTH // From Email.
        + STRING_LENGTH_PREFIX + MAX_TO_EMAIL_LENGTH // To Email.
        + TOKEN_COUNT_LENGTH // Token Count.
        + VALID_DAYS_LENGTH; // Valid days.
}

#[error]
pub enum ErrorCode {
    #[msg("The provided email should be 200 characters long maximum.")]
    EmailTooLong,
    #[msg("The provided tokens should be more than 0")]
    InvalidTokenCount,
    #[msg("The provided validity period for voucher should be more than 0 days")]
    InvalidValidForDays,
}
