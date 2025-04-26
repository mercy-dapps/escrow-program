import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { randomBytes } from "crypto";

describe("escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const connection = provider.connection;

  const program = anchor.workspace.Escrow as Program<Escrow>;

  const programId = program.programId;
  const tokenProgram = TOKEN_2022_PROGRAM_ID;

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      signature,
      ...block,
    });

    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
    );

    return signature;
  };

  const [maker, taker, mintA, mintB] = Array.from({ length: 4 }, () =>
    Keypair.generate()
  );

  const [makerAtaA, makerAtaB, takerAtaA, takerAtaB] = [maker, taker]
    .map((a) =>
      [mintA, mintB].map((m) =>
        getAssociatedTokenAddressSync(
          m.publicKey,
          a.publicKey,
          false,
          tokenProgram
        )
      )
    )
    .flat();

  const seed = new BN(randomBytes(8));

  const escrow = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      maker.publicKey.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  )[0];

  const vault = getAssociatedTokenAddressSync(
    mintA.publicKey,
    escrow,
    true,
    tokenProgram
  );

  const accounts = {
    maker: maker.publicKey,
    taker: taker.publicKey,
    mintA: mintA.publicKey,
    mintB: mintB.publicKey,
    makerAtaA,
    makerAtaB,
    takerAtaA,
    takerAtaB,
    escrow,
    vault,
    tokenProgram,
  };

  it("Airdrop and create mint", async () => {
    let lamports = await getMinimumBalanceForRentExemptMint(connection);

    let tx = new Transaction();

    tx.instructions = [
      ...[maker, taker].map((a) =>
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: a.publicKey,
          lamports: 10 * LAMPORTS_PER_SOL,
        })
      ),
      ...[mintA, mintB].map((m) =>
        SystemProgram.createAccount({
          fromPubkey: provider.publicKey,
          newAccountPubkey: m.publicKey,
          lamports,
          space: MINT_SIZE,
          programId: tokenProgram,
        })
      ),
      ...[
        { mint: mintA.publicKey, authority: maker.publicKey, ata: makerAtaA },
        { mint: mintB.publicKey, authority: taker.publicKey, ata: takerAtaB },
      ].flatMap((x) => [
        createInitializeMint2Instruction(
          x.mint,
          6,
          x.authority,
          null,
          tokenProgram
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          x.ata,
          x.authority,
          x.mint,
          tokenProgram
        ),
        createMintToInstruction(
          x.mint,
          x.ata,
          x.authority,
          1e9,
          undefined,
          tokenProgram
        ),
      ]),
    ];

    await provider.sendAndConfirm(tx, [maker, taker, mintA, mintB]).then(log);
  });

  it("Make", async () => {
    await program.methods
      .make(seed, new BN(1e6), new BN(1e6))
      .accounts({ ...accounts })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Refund", async () => {
    await program.methods
      .refund()
      .accounts({ ...accounts })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  xit("Take", async () => {
    await program.methods
      .take()
      .accounts({ ...accounts })
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log);
  });
});
