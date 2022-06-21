# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Deploy & Verify

Deployed information
```shell

Gold deployed to  0x49e3a80eff7BeE1b115E1c58A835d8cB992768ef
Gold Dex deployed to  0x728701E6eFE98e5965beec5d2Edcdd8889359f0a
Petty deployed to  0xb9401264F5C1bfe2c9E3c4aF83709Aa93B22097c
Reserve deployed to  0x835B3C94eCdfc4cdb800b990e1f37f2827EF7c54
Marketplace deployed to  0x4FAD032d378111fC345F38ff7e3203E461Fc11a4
Gold is payment token true or false: true

```

Verify after deploy
```shell

Gold:
yarn hardhat verify --network testnet 0x49e3a80eff7BeE1b115E1c58A835d8cB992768ef "10000000"

Gold Dex:
yarn hardhat verify --network testnet 0x728701E6eFE98e5965beec5d2Edcdd8889359f0a "0x49e3a80eff7BeE1b115E1c58A835d8cB992768ef"

Petty:
yarn hardhat verify --network testnet 0xb9401264F5C1bfe2c9E3c4aF83709Aa93B22097c

Reserve:
yarn hardhat verify --network testnet 0x835B3C94eCdfc4cdb800b990e1f37f2827EF7c54 "0x49e3a80eff7BeE1b115E1c58A835d8cB992768ef"

Marketplace:
yarn hardhat verify --network testnet 0x4FAD032d378111fC345F38ff7e3203E461Fc11a4 "0xb9401264F5C1bfe2c9E3c4aF83709Aa93B22097c" "0" "0" "0x835B3C94eCdfc4cdb800b990e1f37f2827EF7c54"

```