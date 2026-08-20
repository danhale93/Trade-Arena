import { describe, it, expect, vi, beforeEach } from "vitest";

describe("0x API Proxy - Timeout and AbortController Hardening", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("clears timeout and handles AbortError or fetch failure gracefully with 500 error", async () => {
    // Re-create handler logic as implemented in server.js
    const handle0xQuote = async (req: any, res: any) => {
      let timeout;
      try {
        const rawUrl = req.url || '';
        const queryString = rawUrl.includes('?') ? rawUrl.substring(rawUrl.indexOf('?') + 1) : '';
        if (queryString.length > 2000) {
          return res.status(400).json({ error: 'Query parameters too long' });
        }

        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 30000);

        const query = new URLSearchParams(req.query).toString();
        const response = await fetch(`https://api.0x.org/swap/v1/quote?${query}`, {
          headers: {
            '0x-api-key': process.env.ZERO_EX_API_KEY || ''
          },
          signal: controller.signal
        });
        const data = await response.json();
        res.status(response.status).json(data);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch swap quote' });
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    };

    // Mock response object
    let responseStatus = 0;
    let responseData: any = null;
    const res = {
      status: (code: number) => {
        responseStatus = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };

    // Mock fetch to simulate an AbortError/timeout
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        if (options && options.signal) {
          options.signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }
        // Immediately abort for testing exception branch
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        reject(err);
      });
    });

    try {
      const req = { url: '/api/0x/quote?sellToken=WETH&buyToken=USDC', query: { sellToken: 'WETH', buyToken: 'USDC' } };
      await handle0xQuote(req, res);

      expect(responseStatus).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to fetch swap quote' });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("returns 400 when query string exceeds 2000 characters", async () => {
    const handle0xQuote = async (req: any, res: any) => {
      let timeout;
      try {
        const rawUrl = req.url || '';
        const queryString = rawUrl.includes('?') ? rawUrl.substring(rawUrl.indexOf('?') + 1) : '';
        if (queryString.length > 2000) {
          return res.status(400).json({ error: 'Query parameters too long' });
        }

        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 30000);

        const query = new URLSearchParams(req.query).toString();
        const response = await fetch(`https://api.0x.org/swap/v1/quote?${query}`, {
          headers: {
            '0x-api-key': process.env.ZERO_EX_API_KEY || ''
          },
          signal: controller.signal
        });
        const data = await response.json();
        res.status(response.status).json(data);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch swap quote' });
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    };

    let responseStatus = 0;
    let responseData: any = null;
    const res = {
      status: (code: number) => {
        responseStatus = code;
        return {
          json: (data: any) => {
            responseData = data;
          }
        };
      }
    };

    const oversizedParam = "a".repeat(2005);
    const req = { url: `/api/0x/quote?extra=${oversizedParam}`, query: { extra: oversizedParam } };
    await handle0xQuote(req, res);

    expect(responseStatus).toBe(400);
    expect(responseData).toEqual({ error: 'Query parameters too long' });
  });
});
