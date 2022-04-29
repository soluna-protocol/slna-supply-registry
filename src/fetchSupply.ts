import { SignerWallet, SolanaProvider } from "@saberhq/solana-contrib";
import {
  deserializeAccount,
  getMintInfo,
  Token,
  TokenAmount,
} from "@saberhq/token-utils";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs/promises";
import invariant from "tiny-invariant";

async function tokenBalance(
  provider: SolanaProvider,
  token: Token,
  ata: PublicKey
) {
  const data = await provider.getAccountInfo(ata);
  invariant(data);
  const info = deserializeAccount(data.accountInfo.data);
  return new TokenAmount(token, info.amount);
}

export const fetchSupply = async (): Promise<void> => {
  const provider = SolanaProvider.load({
    connection: new Connection("https://sencha.rpcpool.com"),
    wallet: new SignerWallet(Keypair.generate()),
  });
  const SLNA = Token.fromMint("SLNAAQ8VT6DRDc3W9UPDjFyRt7u4mzh8Z4WYMDjJc35", 6);

  const solUST = Token.fromMint(
    "JAa3gQySiTi8tH3dpkvgztJWHQC1vGXr5m6SQ9LEM55T",
    6
  );

  const slnaMintData = await getMintInfo(provider, SLNA.mintAccount);
  const solustMintData = await getMintInfo(provider, solUST.mintAccount);

  const slnaSupply = new TokenAmount(SLNA, slnaMintData.supply);
  const solustSupply = new TokenAmount(solUST, solustMintData.supply);

  const teamLock = await tokenBalance(
    provider,
    SLNA,
    new PublicKey("C5iV7ozWWCLiZ3Q3FsErrVd7kj8JwM3sgZe248bmEVHf")
  );

  const team = await tokenBalance(
    provider,
    SLNA,
    new PublicKey("DNrVRxg1yGzbVbxumcCeZpXBx7FrzcNXMu2jRfjKEqsS")
  );

  const unclaimedAirdrop = await tokenBalance(
    provider,
    SLNA,
    new PublicKey("Cf7bkB97ncbN4dS97jopyHbPftmiYmcqPwq4vPmRwtz8")
  );

  const circulatingSupply = slnaSupply
    .subtract(team)
    .subtract(teamLock)
    .subtract(unclaimedAirdrop);

  await fs.writeFile(
    "data/supply.json",
    JSON.stringify(slnaSupply.asNumber, null, 2)
  );

  await fs.writeFile(
    "data/circulatingSupply.json",
    JSON.stringify(circulatingSupply.asNumber, null, 2)
  );

  await fs.writeFile(
    "data/solustSupply.json",
    JSON.stringify(solustSupply.asNumber, null, 2)
  );

  console.log(
    `solust supply is ${solustSupply.asNumber}, SLNA supply is ${slnaSupply.asNumber} and SLNA circulating supply is ${circulatingSupply.asNumber}`
  );
};

fetchSupply().catch((err) => console.error(err));
