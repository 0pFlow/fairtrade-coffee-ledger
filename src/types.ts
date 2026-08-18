export interface Transaction {
  sender: string;
  recipient: string;
  batchId: string;
  weightKg: number;
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  nonce: number;
  hash: string;
}

/** A block before its hash has been computed — the input to `calculateHash`. */
export type UnhashedBlock = Omit<Block, 'hash'>;
