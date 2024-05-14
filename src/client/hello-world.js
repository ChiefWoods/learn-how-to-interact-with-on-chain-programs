import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, TransactionInstruction } from "@solana/web3.js";
import { readFile } from 'fs/promises';
import * as borsh from 'borsh';

class HelloWorldAccount {
  constructor(fields) {
    if (fields !== undefined) {
      this.counter = fields.counter;
    }
  }
}

const HelloWorldSchema = new Map([
  [HelloWorldAccount, { kind: 'struct', fields: [['counter', 'u32']] }]
]);

const ACCOUNT_SIZE = borsh.serialize(HelloWorldSchema, new HelloWorldAccount()).length;

export function establishConnection() {
  return new Connection('http://localhost:8899');
}

export async function establishPayer() {
  const secretKeyString = await readFile('../../../workspace/.config/solana/id.json', 'utf8');
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

export async function getProgramId() {
  const secretKeyString = await readFile('dist/program/helloworld-keypair.json', 'utf8');
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const keypair = Keypair.fromSecretKey(secretKey);
  return keypair.publicKey;
}

export async function getAccountPubkey(payer, programId) {
  return await PublicKey.createWithSeed(payer.publicKey, 'tasty', programId);
}

export async function checkProgram(connection, payer, programId, accountPubkey) {
  const programAccount = await connection.getAccountInfo(programId);

  if (!programAccount) {
    throw Error('Account not found')
  } else if (!programAccount.executable) {
    throw Error('Account not executable')
  }

  const programDataAccount = await connection.getAccountInfo(accountPubkey);

  if (!programDataAccount) {
    await createAccount(connection, payer, programId, accountPubkey);
  }
};

export async function createAccount(connection, payer, programId, accountPubkey) {
  const lamports = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
  const transaction = new Transaction(payer);
  const instruction = {
    basePubkey: payer.publicKey,
    fromPubkey: payer.publicKey,
    lamports,
    newAccountPubkey: accountPubkey,
    programId,
    seed: 'tasty',
    space: ACCOUNT_SIZE,
  }
  const tx = SystemProgram.createAccountWithSeed(instruction);
  transaction.add(tx);
  await sendAndConfirmTransaction(connection, transaction, [payer]);
}

export async function sayHello(connection, payer, programId, accountPubkey) {
  const transaction = {
    keys: [{ pubkey: accountPubkey, isSigner: false, isWritable: true }],
    programId,
    data: Buffer.alloc(0),
  };
  const instruction = new TransactionInstruction(transaction);
  await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payer]);
}

export async function getHelloCount(connection, accountPubkey) {
  const accountInfo = await connection.getAccountInfo(accountPubkey);
  const greeting = borsh.deserialize(HelloWorldSchema, HelloWorldAccount, accountInfo.data);
  return greeting.counter;
}