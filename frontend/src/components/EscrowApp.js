import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import EscrowABI from "../abi/Escrow.json";

const ESCROW_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const EscrowApp = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        const tempSigner = await tempProvider.getSigner();
        const tempContract = new ethers.Contract(ESCROW_ADDRESS, EscrowABI, tempSigner);

        setProvider(tempProvider);
        setSigner(tempSigner);
        setContract(tempContract);

        const currentStatus = await tempContract.getStatus();
        setStatus(currentStatus);
      } else {
        alert("Please install MetaMask");
      }
    };

    init();
  }, []);

  const confirmDelivery = async () => {
    const tx = await contract.confirmDelivery();
    await tx.wait();
    setStatus(await contract.getStatus());
  };

  const refund = async () => {
    const tx = await contract.refundClient();
    await tx.wait();
    setStatus(await contract.getStatus());
  };

  return (
    <div className="p-8 max-w-xl mx-auto bg-white shadow-md rounded-xl">
      <h1 className="text-2xl font-bold mb-4">🧾 Escrow Status: {status}</h1>
      <button onClick={confirmDelivery} className="bg-green-500 px-4 py-2 text-white rounded mr-4">
        Confirm Delivery
      </button>
      <button onClick={refund} className="bg-red-500 px-4 py-2 text-white rounded">
        Refund
      </button>
    </div>
  );
};

export default EscrowApp;
