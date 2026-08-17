import { quoteDirectSwap } from "../server/directDex.ts";

for (const network of ["base", "arbitrum", "optimism"]) {
  try {
    const quote = await quoteDirectSwap({ network, amountIn: "0.001", poolFee: 3000 });
    console.log(JSON.stringify({ network, amountOut: quote.amountOut, amountOutRaw: quote.amountOutRaw, quotedAt: quote.quotedAt }));
  } catch (error) {
    console.error(JSON.stringify({ network, error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
  }
}
