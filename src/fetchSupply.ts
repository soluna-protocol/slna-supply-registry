import * as fs from "fs/promises";

export const fetchSupply = async (): Promise<void> => {
  const unix = Date.now() / 1000;

  const genesis = 1647018000;

  const airdrop = 3_657_550;

  const firstPeriod = 604_800;
  const firstAmount = 10_000_000;

  const secondPeriod = 3_888_000;
  const secondAmount = 45_000_000;

  const secondsPerDay = 86_400;

  const supply =
    unix > genesis + firstPeriod + secondPeriod
      ? airdrop +
        firstAmount +
        secondAmount +
        (unix - genesis - firstPeriod - secondPeriod) *
          (150_000 / secondsPerDay)
      : unix > genesis + firstPeriod
      ? airdrop +
        firstAmount +
        (unix - genesis - firstPeriod) * (1_000_000 / secondsPerDay)
      : airdrop + (unix - genesis) * (2_000_000 / secondsPerDay);

  await fs.writeFile("data/supply.json", JSON.stringify(supply, null, 2));

  console.log(`Circulating Supply is ${supply}`);
};

fetchSupply().catch((err) => console.error(err));
