import { describe, expect, it } from "vitest";
import { CLI_COMMANDS, CLI_LINKS, commandDeckHasNoTokenValues } from "./cliCommandDeck";

describe("CLI command deck", () => {
  it("uses official MetaMask documentation and authorization links", () => {
    expect(CLI_LINKS.docs).toMatch(/^https:\/\/docs\.metamask\.io\//);
    expect(CLI_LINKS.commands).toMatch(/^https:\/\/docs\.metamask\.io\//);
    expect(CLI_LINKS.login).toBe("https://developer.metamask.io/agentic/login");
  });

  it("includes install, doctor, token-link, wallet, and balance commands", () => {
    const commands = CLI_COMMANDS.map((item) => item.command);
    expect(commands).toContain("npm install -g @metamask/agent-wallet@latest");
    expect(commands).toContain("mm doctor --json");
    expect(commands).toContain("mm login browser --no-wait");
    expect(commands).toContain("mm wallet address --json");
    expect(commands).toContain("mm wallet balance --chain-ids 8453 --json");
  });

  it("does not contain a real token value", () => {
    expect(commandDeckHasNoTokenValues()).toBe(true);
    expect(CLI_COMMANDS.find((item) => item.id === "apply-token")?.command).toContain("<cliToken:cliRefreshToken>");
  });
});
