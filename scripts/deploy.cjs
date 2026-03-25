require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Vault contract to X Layer...");
  console.log("PRIVATE_KEY loaded:", !!process.env.PRIVATE_KEY);

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();

  await vault.deployed();
  const address = vault.address;

  console.log("Vault deployed to:", address);
  console.log("Owner:", await vault.owner());
  console.log("Initial balance:", await vault.getBalance());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
