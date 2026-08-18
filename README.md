# Fair Trade Coffee Ledger

A decentralized logistics ledger (blockchain) for tracking Fair Trade coffee batches
as they move from farm to roastery to café. Built as a Node.js + Express REST API,
protected by a SHA-256 Proof-of-Work mechanism.

Course assignment — Medieinstitutet, Backend Node.js.

## Status

Project scaffold. Implementation follows TDD (red → green), see commit history.

## Planned endpoints

| Method | Path            | Description                                             |
| ------ | --------------- | ------------------------------------------------------- |
| GET    | `/blockchain`   | Returns the full chain for auditing                      |
| POST   | `/transactions` | Validates and queues a new coffee movement               |
| POST   | `/mine`         | Mines pending transactions into a new block              |
