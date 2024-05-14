import { establishConnection, getProgramId, establishPayer, getAccountPubkey, checkProgram, sayHello, getHelloCount } from "./hello-world.js";

async function main() {
  const connection = establishConnection();
  console.log("Saying 'hello' to a Solana account")
  const programId = await getProgramId();
  const payer = await establishPayer();
  const accountPubkey = await getAccountPubkey(payer, programId);
  await checkProgram(connection, payer, programId, accountPubkey);
  await sayHello(connection, payer, programId, accountPubkey);
  const helloCount = await getHelloCount(connection, accountPubkey);
  console.log('Hello count:', helloCount);
}

await main();