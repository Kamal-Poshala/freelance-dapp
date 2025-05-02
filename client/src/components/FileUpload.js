import React, { useState } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";

const ipfs = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

function FileUpload() {
  const [fileUrl, setFileUrl] = useState(null);

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    try {
      const added = await ipfs.add(file);
      setFileUrl(`https://ipfs.io/ipfs/${added.path}`);
    } catch (error) {
      alert("IPFS upload failed");
    }
  };

  return (
    <div>
      <input type="file" onChange={onFileChange} />
      {fileUrl && (
        <div>
          <p>File uploaded to IPFS:</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">{fileUrl}</a>
        </div>
      )}
    </div>
  );
}

export default FileUpload;