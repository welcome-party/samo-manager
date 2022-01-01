# samo-manager
Rust & react app that makes it easy for people to join Solana Blockchain.
(https://welcome-party.netlify.app/)

# Build, deploy and start locally:

```
solana config set --url localhost
```
Update your Anchor.toml file if need be

## Run the tests.
```
anchor test
```

## Copy the new IDL to the frontend.
```
anchor run copy-idl
```

## build & deploy locally
```
solana-test-validator
anchor build
anchor deploy
```

# Checking Program Id 
```
solana address -k target/deploy/samo_manager-keypair.json
```

# Start your frontend application locally.
```
cd app
export REACT_APP_CLUSTER_URL=http://127.0.0.1:8899
# export REACT_APP_CLUSTER_URL=https://api.devnet.solana.com
# export REACT_APP_CLUSTER_URL=https://api.mainnet-beta.solana.com
npm run start
```

# Switch to the devnet cluster to deploy there.
```
solana config set --url devnet
```
- And update your Anchor.toml file.
- Airdrop yourself some money if necessary: `solana airdrop 5`

# Build and deploy
```
anchor build
anchor deploy
```

# Good resources
For installation and example instructions:
* https://lorisleiva.com/create-a-solana-dapp-from-scratch/getting-started-with-solana-and-anchor
* https://dev.to/dabit3/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291
