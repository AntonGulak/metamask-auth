const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const crypto = require("crypto");
const ethers = require("ethers");

const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/get-nonce/:address", (req, res) => {
  const address = req.params.address.toLowerCase();

  const nonce = crypto.randomBytes(16).toString("hex");

  fs.writeFileSync(`./nonces/${address}.txt`, nonce);

  res.json({ nonce });
});

app.post("/auth", (req, res) => {
  const { signature, signerAddress } = req.body;

  if (!signature || !signerAddress)
    return res.status(400).send("Required parameters missing.");

  const nonceFilePath = `./nonces/${signerAddress.toLowerCase()}.txt`;

  if (!fs.existsSync(nonceFilePath)) {
    return res.status(401).send("Nonce does not exist.");
  }

  const nonce = fs.readFileSync(nonceFilePath, "utf8");
  fs.unlinkSync(nonceFilePath);

  const msg = `I am ${signerAddress} signing my one-time nonce: ${nonce}`;

  const addressFromSignature = ethers.verifyMessage(msg, signature);

  if (signerAddress.toLowerCase() === addressFromSignature.toLowerCase()) {
    res.send("Authenticated!");
  } else {
    res.status(403).send("Unauthorized.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
