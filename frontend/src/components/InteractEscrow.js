import React, { useState } from "react";
import { ethers } from "ethers";
import EscrowABI from "../abi/Escrow.json";

const InteractEscrow = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [contract, setContract] = useState(null);
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState("");

  const connectContract = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const escrow = new ethers.Contract(contractAddress, EscrowABI, signer);
      setContract(escrow);

      const [client, freelancer, amount, state] = await Promise.all([
        escrow.client(),
        escrow.freelancer(),
        escrow.amount(),
        escrow.getStatus(),
      ]);

      setInfo({
        client,
        freelancer,
        amount: ethers.formatEther(amount),
        state,
      });
      setStatus("✅ Contract loaded!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error loading contract.");
    }
  };

  const handleConfirm = async () => {
    try {
      const tx = await contract.confirmDelivery();
      await tx.wait();
      setStatus("✅ Delivery confirmed!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error confirming delivery.");
    }
  };

  const handleRefund = async () => {
    try {
      const tx = await contract.refundClient();
      await tx.wait();
      setStatus("✅ Refund successful!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error processing refund.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-center">Interact with Escrow</h2>

      <input
        type="text"
        placeholder="Paste Contract Address"
        value={contractAddress}
        onChange={(e) => setContractAddress(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={connectContract}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Connect Contract
      </button>

      {info && (
        <div className="mt-6 space-y-2">
          <p><strong>Client:</strong> {info.client}</p>
          <p><strong>Freelancer:</strong> {info.freelancer}</p>
          <p><strong>Amount:</strong> {info.amount} ETH</p>
          <p><strong>Status:</strong> {info.state}</p>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleConfirm}
              className="bg-green-500 text-white px-4 py-2 rounded w-1/2"
            >
              ✅ Confirm Delivery
            </button>
            <button
              onClick={handleRefund}
              className="bg-red-500 text-white px-4 py-2 rounded w-1/2"
            >
              ❌ Refund
            </button>
          </div>
        </div>
      )}

      {status && <p className="mt-4 text-center text-sm">{status}</p>}
    </div>
  );
};

export default InteractEscrow;
