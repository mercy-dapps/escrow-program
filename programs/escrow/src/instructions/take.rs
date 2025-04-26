use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken, token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked, CloseAccount, close_account}
};
use crate::state::Escrow;

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub maker: SystemAccount<'info>,

    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub mint_a: InterfaceAccount<'info, Mint>,

    #[account(
        mint::token_program = token_program
    )]
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program
    )]
    pub taker_ata_a: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_b,
        associated_token::authority = taker,
        associated_token::token_program = token_program
    )]
    pub taker_ata_b: InterfaceAccount<'info, TokenAccount>,


    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_b,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        close = maker,
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,


}

impl<'info> Take<'info> {

    pub fn transfer_to_maker(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let transfer_accounts = TransferChecked {
            from: self.taker_ata_b.to_account_info(),
            mint: self.mint_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            authority: self.taker.to_account_info()
        };

        let cpi_ctx = CpiContext::new(cpi_program, transfer_accounts);

        transfer_checked(cpi_ctx, self.escrow.receive, self.mint_b.decimals) 
    }

    pub fn withdraw_and_close(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info()
        };

        let seeds = &[
            b"escrow",
            self.maker.to_account_info().key.as_ref(), 
            &self.escrow.seed.to_le_bytes()[..],
            &[self.escrow.bump]
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals)?;

        // close 
        let close_accounts = CloseAccount{
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.escrow.to_account_info()
           };

        let close_cpi_ctx = CpiContext::new_with_signer(self.token_program.to_account_info(), close_accounts, signer_seeds);

       close_account(close_cpi_ctx)

    }

    // pub fn close(&mut self) -> Result<()> {
    //    let close_accounts = CloseAccount{
    //     account: self.vault.to_account_info(),
    //     destination: self.maker.to_account_info(),
    //     authority: self.escrow.to_account_info()
    //    };

    //    let seeds = &[
    //         b"escrow",
    //         self.maker.to_account_info().key.as_ref(), &self.escrow.seed.to_le_bytes()[..],
    //         &[self.escrow.bump]
    //     ];

    //     let signer_seeds = &[&seeds[..]];

    //    let close_cpi_ctx = CpiContext::new_with_signer(self.token_program.to_account_info(), close_accounts, signer_seeds);

    //    close_account(close_cpi_ctx)
    // }
}