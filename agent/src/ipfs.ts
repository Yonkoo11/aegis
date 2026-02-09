/**
 * IPFS upload via Pinata.
 */

export interface PinResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function uploadToIPFS(
  content: string,
  name: string,
  pinataApiKey: string,
  pinataSecret: string
): Promise<string> {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecret,
    },
    body: JSON.stringify({
      pinataContent: JSON.parse(content),
      pinataMetadata: { name: `aegis-report-${name}` },
    }),
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as PinResponse;
  return data.IpfsHash;
}

export function ipfsUrl(hash: string): string {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}
