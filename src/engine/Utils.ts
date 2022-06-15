//Update to flow in rest of chains


import {
  FlashbotsBundleProvider,
  FlashbotsBundleTransaction,
} from "@flashbots/ethers-provider-bundle";
import { BigNumber } from "ethers";

export const ETHER = BigNumber.from(10).pow(18);
export const GWEI = BigNumber.from(10).pow(9);

export async function checkSimulation(
  flashbotsProvider: FlashbotsBundleProvider,
  signedBundle: Array<string>
): Promise<BigNumber> {
  const simulationResponse = await flashbotsProvider.simulate(
    signedBundle,
    "latest"
  );

  if ("results" in simulationResponse) {
    for (let i = 0; i < simulationResponse.results.length; i++) {
      const txSimulation = simulationResponse.results[i];
      if ("error" in txSimulation) {
        throw new Error(
          `TX #${i} : ${txSimulation.error} ${txSimulation.revert}`
        );
      }
    }

    if (simulationResponse.coinbaseDiff.eq(0)) {
      throw new Error("Does not pay coinbase");
    }

    const gasUsed = simulationResponse.results.reduce(
      (acc: number, txSimulation) => acc + txSimulation.gasUsed,
      0
    );

    const gasPrice = simulationResponse.coinbaseDiff.div(gasUsed);
    return gasPrice;
  }

  throw new Error(
    `Simulation failed: ${simulationResponse.error.code}; ${simulationResponse.error.message}`
  );
}

export async function getTransactionsLog(
  bundleTransactions: Array<FlashbotsBundleTransaction>,
  signedBundle: Array<string>
): Promise<string> {
  let ret = "--------------------------------";
  ret += (
    await Promise.all(
      bundleTransactions.map(
        async (bundleTx, index) =>
          `TX #${index}: ${await bundleTx.signer.getAddress()} => ${
            bundleTx.transaction.to
          } : ${bundleTx.transaction.data}`
      )
    )
  ).join("\n");

  ret += "--------------------------------";
  console.log(
    (
      await Promise.all(
        signedBundle.map(async (signedTx, index) => `TX #${index}: ${signedTx}`)
      )
    ).join("\n")
  );

  ret += "--------------------------------";
  return ret;
}

export function gasPriceToGwei(gasPrice: BigNumber): number {
  return gasPrice.mul(100).div(GWEI).toNumber() / 100;
}
