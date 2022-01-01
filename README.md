# samo-manager
SAMO smart contract

# Installation, Build & Deploy
* https://lorisleiva.com/create-a-solana-dapp-from-scratch/getting-started-with-solana-and-anchor
* https://dev.to/dabit3/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291

# Make sure you’re on the localnet.
solana config set --url localhost
# And check your Anchor.toml file.

# Code…

# Run the tests.
anchor test

# Build, deploy and start a local ledger.
solana-test-validator
anchor build
anchor deploy

# Program Id 
solana address -k target/deploy/samo_manager-keypair.json

# Copy the new IDL to the frontend.
anchor run copy-idl

# Start your frontend application locally.
cd app
export REACT_APP_CLUSTER_URL=http://127.0.0.1:8899
# export REACT_APP_CLUSTER_URL=https://api.devnet.solana.com
# export REACT_APP_CLUSTER_URL=https://api.mainnet-beta.solana.com
npm run start

# Switch to the devnet cluster to deploy there.
solana config set --url devnet
# And update your Anchor.toml file.

# Airdrop yourself some money if necessary.
solana airdrop 5

# Build and deploy to devnet.
anchor build
anchor deploy

# Push your code to the main branch to auto-deploy on Netlify.
git push
