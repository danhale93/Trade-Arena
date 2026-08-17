# External deployment notes for direct Ethers.js adapter

Sources:

- Uniswap deployment overview: https://developers.uniswap.org/docs/protocols/v3/deployments
- Base deployments: https://developers.uniswap.org/docs/protocols/v3/deployments/v3-base-deployments
- Arbitrum deployments: https://developers.uniswap.org/docs/protocols/v3/deployments/v3-arbitrum-deployments
- Optimism deployments: https://developers.uniswap.org/docs/protocols/v3/deployments/v3-optimism-deployments
- Circle USDC addresses: https://developers.circle.com/stablecoins/usdc-contract-addresses
- Uniswap single-hop swap guide: https://developers.uniswap.org/docs/protocols/v3/guides/swapping/single-hop-swapping
- Uniswap quote guide: https://developers.uniswap.org/docs/sdks/v3/guides/swapping/quoting

Verified mainnet values:

| Chain | Chain ID | WETH | Native USDC | SwapRouter02 | QuoterV2 |
| --- | ---: | --- | --- | --- | --- |
| Base | 8453 | 0x4200000000000000000000000000000000000006 | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 | 0x2626664c2603336E57B271c5C0b26F421741e481 | 0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a |
| Arbitrum One | 42161 | 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 | 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45 | 0x61fFE014bA17989E743c5F6cB21bF9697530B21e |
| OP Mainnet | 10 | 0x4200000000000000000000000000000000000006 | 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 | 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45 | 0x61fFE014bA17989E743c5F6cB21bF9697530B21e |

Uniswap's current documentation states that UniversalRouter is the preferred entry point, replacing SwapRouter02, while the chain pages provide SwapRouter02 and QuoterV2 addresses. This implementation should use the explicitly configured SwapRouter02 ABI only after validating the contract code and should not assume addresses are shared across chains.

Circle's documentation warns that mainnet tokens have financial value and that addresses and private keys must be verified and kept private.
