import { describe, it, expect, vi } from "vitest";

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({
    authenticated: false,
    user: null,
    login: () => {},
    logout: () => {},
    ready: true,
    createWallet: () => Promise.resolve(),
  }),
  useWallets: () => ({
    wallets: [],
    ready: true,
  }),
}));

import { truncateAddress } from "../../../public/src/components/PrivyWalletHeader";

describe("PrivyWalletHeader utilities & wallet isolation", () => {
  describe("truncateAddress", () => {
    it("truncates standard 42-character Ethereum address cleanly", () => {
      const address = "0x1234567890abcdef1234567890abcdef12345678";
      expect(truncateAddress(address)).toBe("0x1234...5678");
    });

    it("truncates address ending in letters as requested", () => {
      const address = "0x1234567890abcdef1234567890abcdef1234abcd";
      expect(truncateAddress(address)).toBe("0x1234...abcd");
    });

    it("returns '0x...' for null, undefined, or empty address", () => {
      expect(truncateAddress(null)).toBe("0x...");
      expect(truncateAddress(undefined)).toBe("0x...");
      expect(truncateAddress("")).toBe("0x...");
    });

    it("returns '0x...' for address shorter than 10 characters", () => {
      expect(truncateAddress("0x123")).toBe("0x...");
    });
  });

  describe("Embedded Wallet Filtering (walletClientType === 'privy')", () => {
    const filterEmbeddedWallet = (wallets: Array<{ walletClientType: string; address: string }> | null | undefined) => {
      if (!wallets || !Array.isArray(wallets)) return null;
      return wallets.find((w) => w.walletClientType === "privy") || null;
    };

    it("isolates active Privy embedded wallet when multiple wallets are present", () => {
      const mockWallets = [
        { walletClientType: "metamask", address: "0xAAAA111122223333444455556666777788889999" },
        { walletClientType: "privy", address: "0x1234567890abcdef1234567890abcdef1234abcd" },
        { walletClientType: "coinbase_wallet", address: "0xBBBB111122223333444455556666777788889999" },
      ];

      const isolated = filterEmbeddedWallet(mockWallets);
      expect(isolated).not.toBeNull();
      expect(isolated?.walletClientType).toBe("privy");
      expect(isolated?.address).toBe("0x1234567890abcdef1234567890abcdef1234abcd");
      expect(truncateAddress(isolated?.address)).toBe("0x1234...abcd");
    });

    it("returns null when no Privy embedded wallet is present in array", () => {
      const mockWallets = [
        { walletClientType: "metamask", address: "0xAAAA111122223333444455556666777788889999" },
      ];

      const isolated = filterEmbeddedWallet(mockWallets);
      expect(isolated).toBeNull();
    });

    it("returns null when wallets array is empty or undefined", () => {
      expect(filterEmbeddedWallet([])).toBeNull();
      expect(filterEmbeddedWallet(null)).toBeNull();
      expect(filterEmbeddedWallet(undefined)).toBeNull();
    });
  });
});
