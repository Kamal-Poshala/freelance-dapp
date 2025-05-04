# Decentralized Freelance Marketplace

A decentralized application (DApp) built on Ethereum that allows clients to hire freelancers, manage payments through an escrow system, and resolve disputes using a DAO (Decentralized Autonomous Organization). The project integrates smart contracts (developed with Hardhat) and a React frontend, with file uploads handled via Pinata (IPFS).

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Running the Frontend](#running-the-frontend)
- [Testing the Workflow](#testing-the-workflow)
- [Directory Structure](#directory-structure)
- [Security Notes](#security-notes)
- [Future Improvements](#future-improvements)

## Overview

This project creates a decentralized freelance marketplace where:
- **Clients** can create jobs, fund them via escrow, and confirm or dispute deliveries.
- **Freelancers** can submit deliverables (stored on IPFS via Pinata) and receive payments upon confirmation.
- **Disputes** are resolved by a DAO, where jurors vote to decide outcomes and earn reputation tokens.

The smart contracts are written in Solidity and deployed using Hardhat. The frontend is built with React and interacts with the contracts using `ethers.js`. File uploads are handled via Pinata, leveraging IPFS for decentralized storage.

## Features

- **Escrow System**: Secure payments with an escrow contract that releases funds upon delivery confirmation.
- **Reputation Tokens**: Both clients and freelancers earn reputation tokens for successful transactions.
- **Dispute Resolution DAO**: A decentralized voting system for resolving disputes between clients and freelancers.
- **IPFS Integration**: Deliverables are uploaded to IPFS via Pinata for decentralized storage.
- **Local Testing**: Pre-configured Hardhat accounts for easy testing (client and freelancer roles).

## Project Demo

[![Watch the Demo](https://img.youtube.com/vi/lUf8aVmSUtQ/0.jpg)](https://youtu.be/lUf8aVmSUtQ?si=rC3GC_QOnARlTxoC)

Click the image above to watch the full demo of our decentralized freelance marketplace on YouTube.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: Version 18.20.4 (recommended). Use `nvm` to manage Node versions:
  ```bash
  nvm install 18.20.4
  nvm use 18.20.4
  ```
- **Git**: To clone the repository.
- **Hardhat**: For smart contract development and deployment.
- **Pinata Account**: For IPFS file storage. Sign up at [Pinata](https://www.pinata.cloud/) and obtain your API Key, API Secret, and JWT.
- **MetaMask** (optional): For testing with a browser wallet instead of Hardhat accounts.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Saiprasad48/decentralized-freelance-marketplace.git
   cd decentralized-freelance-marketplace
   ```

2. **Install Backend Dependencies**:
   - Install Hardhat and other dependencies for the smart contract backend:
     ```bash
     npm install
     ```

3. **Install Frontend Dependencies**:
   - Navigate to the `client` directory and install React dependencies:
     ```bash
     cd client
     npm install
     cd ..
     ```

4. **Set Up Environment Variables**:
   - In the `client` directory, create a `.env` file to store your Pinata API keys:
     ```bash
     cd client
     echo > .env
     ```
   - Edit `.env` and add your Pinata credentials:
     ```
     REACT_APP_PINATA_API_KEY=your_pinata_api_key
     REACT_APP_PINATA_API_SECRET=your_pinata_api_secret
     REACT_APP_PINATA_JWT=your_pinata_jwt
     ```
   - Note: The `.env` file is excluded from Git for security (via `.gitignore`).

## Smart Contract Deployment

1. **Start a Local Hardhat Node**:
   - Run a local Ethereum node with pre-funded accounts:
     ```bash
     npx hardhat node
     ```
   - This will output a list of Hardhat accounts with their addresses and private keys. Example:
     ```
     Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
     Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff5

     Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
     Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365
     ```
   - Keep this terminal running.

2. **Add Private Keys to `App.js`** (for local testing):
   - Open `client/src/App.js` and update the `HARDHAT_ACCOUNTS` array with the private keys from the Hardhat node output:
     ```javascript
     const HARDHAT_ACCOUNTS = [
       { 
         address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 
         label: "Client (Account 0)", 
         privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff5"
       },
       { 
         address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 
         label: "Freelancer (Account 2)", 
         privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365"
       },
     ];
     ```
   - **Warning**: Do not commit private keys to Git. They are removed in the repository for security.

3. **Deploy Smart Contracts**:
   - In a new terminal, deploy the contracts to the local Hardhat network:
     ```bash
     npx hardhat run scripts/deploy.js --network localhost
     ```
   - This will deploy the `Escrow`, `ReputationToken`, and `DisputeDAO` contracts and output their addresses. Example:
     ```
     Escrow deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
     ReputationToken deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0515
     DisputeDAO deployed to: 0x9A676e781A523b5d0C0e43731313A708CB607508
     ```
   - Update `client/src/config.json` with the deployed contract addresses:
     ```json
     {
       "ESCROW_ADDRESS": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
       "REP_TOKEN_ADDRESS": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0515",
       "DAO_ADDRESS": "0x9A676e781A523b5d0C0e43731313A708CB607508"
     }
     ```

## Running the Frontend

1. **Start the React App**:
   - From the `client` directory, start the frontend development server:
     ```bash
     cd client
     npm start
     ```
   - The app will open in your browser at `http://localhost:3000`.

2. **Interact with the App**:
   - The app provides a UI to connect wallets, create jobs, fund jobs, submit deliveries, confirm deliveries, initiate disputes, and vote on disputes via the DAO.

## Testing the Workflow

1. **Connect as Client**:
   - Select "Client (Account 0)" from the dropdown and click "Connect Wallet".
   - Expected: Wallet connects as `0xf39F...92266`.

2. **Create a Job**:
   - Inputs:
     - Freelancer Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Freelancer Account 2).
     - Amount: `1.5` (ETH).
   - Click "Create Job".
   - Expected: Job created with ID (e.g., `1`).

3. **Fund the Job**:
   - Inputs: Job ID: `1`.
   - Click "Fund Job".
   - Expected: Job status updates to "Funded".

4. **Connect as Freelancer**:
   - Select "Freelancer (Account 2)" and click "Connect Wallet".
   - Expected: Wallet connects as `0x3C44...293BC`.

5. **Submit Delivery**:
   - Inputs:
     - Job ID: `1`.
     - Choose File: Upload a sample file (e.g., `Sample Delivery.txt`).
   - Click "Submit Delivery".
   - Expected: File uploaded to IPFS (via Pinata), and job status updates to "Delivered".

6. **Confirm Delivery (as Client)**:
   - Switch back to "Client (Account 0)" and connect wallet.
   - Inputs: Job ID: `1`.
   - Click "Confirm Delivery".
   - Expected: Payment released to freelancer, and job status updates to "Confirmed".

7. **Dispute Resolution (Optional)**:
   - Instead of confirming, you can initiate a dispute and use the DAO to vote on the outcome.

## Directory Structure

```
decentralized-freelance-marketplace/
├── client/                    # React frontend
│   ├── src/
│   │   ├── App.js            # Main frontend logic
│   │   ├── abis/             # Contract ABIs
│   │   └── config.json       # Contract addresses
│   └── .env                  # Environment variables (not in Git)
├── contracts/                 # Solidity smart contracts
│   ├── Escrow.sol
│   ├── ReputationToken.sol
│   └── DisputeDAO.sol
├── scripts/                   # Deployment scripts
│   └── deploy.js
├── test/                      # Hardhat tests
├── hardhat.config.js          # Hardhat configuration
└── README.md                  # Project documentation
```

## Security Notes

- **Private Keys**: The `HARDHAT_ACCOUNTS` array in `App.js` has private keys removed for security. Add them manually for local testing (see [Smart Contract Deployment](#smart-contract-deployment)).
- **Environment Variables**: Pinata API keys are stored in `client/.env`, which is excluded from Git. Ensure you add your own keys.
- **Production Use**: This project uses hardcoded Hardhat accounts for testing. In production, use a wallet like MetaMask to manage accounts securely.

## Future Improvements

- **MetaMask Integration**: Replace hardcoded accounts with browser wallet support for production use.
- **Advanced Dispute Resolution**: Add features like juror staking or time-limited voting.
- **UI Enhancements**: Improve the frontend with better styling and user feedback.
- **Testing**: Add more comprehensive unit tests for smart contracts.
- **CI/CD**: Set up GitHub Actions for automated testing and deployment.
<<<<<<< HEAD
=======
=======
# Decentralized Freelance Platform

This repository represents the **individual development work of Kamal Poshala**  
as part of the decentralized freelance marketplace project.

At the final stage, this work will be **merged into the team repository**  
maintained by Saiprasad: [Saiprasad's GitHub Repository](https://github.com/Saiprasad48/decentralized-freelance-marketplace).


## 👨‍💻 Developer Note

✅ Kamal's Repository: [https://github.com/Kamal-Poshala/freelance-dapp](https://github.com/Kamal-Poshala/freelance-dapp)  
✅ Team Final Repository (to be merged): [https://github.com/Saiprasad48/decentralized-freelance-marketplace](https://github.com/Saiprasad48/decentralized-freelance-marketplace)

