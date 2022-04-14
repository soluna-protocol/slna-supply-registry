import { SignerWallet, SolanaProvider } from "@saberhq/solana-contrib";
import {
  deserializeAccount,
  deserializeMint,
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

  const meta = await provider.getAccountInfo(SLNA.mintAccount);
  invariant(meta);
  const metaInfo = deserializeMint(meta.accountInfo.data);

  const supply = new TokenAmount(SLNA, metaInfo.supply);

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

  const circulatingSupply = supply
    .subtract(team)
    .subtract(teamLock)
    .subtract(unclaimedAirdrop);

  await fs.writeFile(
    "data/supply.json",
    JSON.stringify(supply.asNumber, null, 2)
  );

  await fs.writeFile(
    "data/circulatingSupply.json",
    JSON.stringify(circulatingSupply.asNumber, null, 2)
  );
  console.log(
    `Supply is ${supply.asNumber} and circulating supply is ${circulatingSupply.asNumber}`
  );
};

fetchSupply().catch((err) => console.error(err));
