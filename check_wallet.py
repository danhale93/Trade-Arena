import requests
import json
# Using requests for RPC

def get_balance(address):
    url = "https://mainnet.base.org"
    payload = {
        "jsonrpc": "2.0",
        "method": "eth_getBalance",
        "params": [address, "latest"],
        "id": 1
    }
    response = requests.post(url, json=payload)
    result = response.json()
    if "result" in result:
        balance_wei = int(result["result"], 16)
        balance_eth = balance_wei / 10**18
        return balance_eth
    return None

def get_transactions(address):
    # Basescan API endpoint for normal transactions
    # Using a public rate-limited endpoint if possible, or just scraping if needed.
    # However, Basescan API usually requires a key. Let's try to fetch from Blockscout which is often more open.
    url = f"https://base.blockscout.com/api/v2/addresses/{address}/transactions"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return data.get("items", [])
    except Exception as e:
        print(f"Error fetching transactions: {e}")
    return []

if __name__ == "__main__":
    address = "0x2ca1f801c1e19d16160c982c627e2932e95117be"
    balance = get_balance(address)
    print(f"Address: {address}")
    print(f"Balance: {balance} ETH")
    
    print("\nRecent Transactions:")
    txs = get_transactions(address)
    if not txs:
        print("No recent transactions found or error fetching them.")
    for tx in txs[:10]:
        print(f"Hash: {tx.get('hash')}")
        print(f"From: {tx.get('from', {}).get('hash')}")
        print(f"To: {tx.get('to', {}).get('hash')}")
        print(f"Value: {int(tx.get('value', 0)) / 10**18} ETH")
        print(f"Status: {tx.get('status')}")
        print("-" * 20)
