import { useState } from "react";
import CreateJob from "./components/CreateJob";

function App() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask is not installed!");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Decentralized Freelance Platform</h1>
      
      {account ? (
        <>
          <h2>Connected Account:</h2>
          <p>{account}</p>
          <CreateJob />
        </>
      ) : (
        <button onClick={connectWallet}>Connect MetaMask Wallet</button>
      )}
    </div>
  );
}

export default App;
