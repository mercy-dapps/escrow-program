<h1 align="center">🤝 Solana Escrow</h1>
<p align="center">A secure, trustless token escrow smart contract on Solana built with Anchor.</p>

---

## 🔐 About the Project

**Escrow** is a Solana smart contract that enables two users to exchange tokens securely and without trust. This is achieved through an on-chain escrow account that only releases funds when both parties fulfill their obligations.

Built using **Anchor** and tested locally, this project demonstrates how to handle:

- Token transfers
- PDAs and account constraints
- Ownership validation
- Secure program logic on Solana

---

## ✨ Features

- 🔄 Lock tokens in escrow
- 🧾 Support for SPL tokens
- ✅ Accept & complete escrow by second party
- ❌ Cancel by initializer if not fulfilled
- 🔐 Authority and PDA validation
- 🧪 Anchor-based test suite

---

## 🛠 Tech Stack

- 🦀 Rust + Anchor Framework
- 💰 SPL Token program
- 🔗 Solana Web3.js
- 🧪 Anchor test environment

---

## 🚀 Getting Started

### Prerequisites

- [Solana CLI](https://docs.solana.com/cli/install-solana-cli)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Rust](https://www.rust-lang.org/tools/install)
- Node.js

### 1. Clone the repo

```bash
git clone https://github.com/mercy-dapps/escrow-program.git
cd escrow
npm install
```

### 2. Build

```bash
anchor build
```

### 3. test

```bash
anchor test
```
![escrow test](<img width="1385" alt="escrow test" src="https://github.com/user-attachments/assets/2edfcbb4-da68-4aeb-b87f-2bd0d0c90e1d" />)

