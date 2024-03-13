VERSION=v0.0.1
CONTRACTS_DIR=../pegasus/packages/solidity/
CI_RPC_URL=http://ci1.usual.team:8545
CHAIN_ID=1
STABLESWAP_NG_FACTORY=0x6A8cbed756804B16E05E741eDaBd5cB544AE21bf
USDC=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
RUN_LATEST_JSON=${CONTRACTS_DIR}/broadcast/FinalConfig.s.sol/${CHAIN_ID}/run-latest.json
REGISTRY_CONTRACT=$$(jq -r '.transactions[] | select((.transactionType == "CREATE" or .transactionType == "CREATE2") and .contractName == "RegistryContract") | .contractAddress' ${RUN_LATEST_JSON})
CALL=cast call -r http://localhost:8545
GET_CONTRACT=${CALL} "${REGISTRY_CONTRACT}" "getContract(bytes32)(address)"
STBC=$$(${GET_CONTRACT} "$$(cast keccak CONTRACT_USUSD)")
STBC_CURVE_POOL=$$(${CALL} ${STABLESWAP_NG_FACTORY} "find_pool_for_coins(address,address)(address)" "${STBC}" "${USDC}")

ifndef VERBOSE
.SILENT:
endif

.PHONY: abis

exec: anvil graph seed

anvil:
	docker compose up -d anvil

	cd "${CONTRACTS_DIR}" && yarn deploy:local

graph:
	docker compose up -d graph-node

	echo "Waiting for graph-node..."
	while ! bash -c '[[ `curl -Is http://localhost:8020` == HTTP/* ]]'; do sleep 0.1; done

	yarn build
	yarn remove:local
	yarn create:local
	yarn deploy:local -l "${VERSION}"

seed:
	cd "${CONTRACTS_DIR}" && yarn seed:local

ci: anvil-ci graph-ci seed-ci

anvil-ci:
	cd "${CONTRACTS_DIR}" && yarn deploy:local "${CI_RPC_URL}"

seed-ci:
	cd "${CONTRACTS_DIR}" && yarn seed -r "${CI_RPC_URL}"

graph-ci:
	yarn build
	yarn remove:ci
	yarn create:ci
	yarn deploy:ci -l "${VERSION}"

deps:
	yarn
	yarn codegen
	docker compose pull

abis:
	jq '.abi' "${CONTRACTS_DIR}/out/stbc.sol/Stbc.json" > ./abis/Stbc.json
	jq '.abi' "${CONTRACTS_DIR}/out/daoCollateral.sol/DaoCollateral.json" > ./abis/DaoCollateral.json
	jq '.abi' "${CONTRACTS_DIR}/out/lusDAO.sol/LusDAO.json" > ./abis/LusDAO.json
	jq '.abi' "${CONTRACTS_DIR}/out/lsausUSDFactory.sol/LsausUSDFactory.json" > ./abis/LsausUSDFactory.json
	jq '.abi' "${CONTRACTS_DIR}/out/ICurveFactory.sol/ICurveFactory.json" > ./abis/CurveFactory.json
	jq '.abi' "${CONTRACTS_DIR}/out/ICurvePool.sol/ICurvePool.json" > ./abis/CurvePool.json
	jq '.abi' "${CONTRACTS_DIR}/out/IGauge.sol/IGauge.json" > ./abis/CurveGauge.json

	# Library events are missing from the ABI before 0.8.20 (see https://github.com/ethereum/solidity/pull/10996)
	jq -s '.[0].abi + [ .[1].abi[] | select(.type == "event") ]' "${CONTRACTS_DIR}/out/mintEngineCpOrderbook.sol/MintEngineCpOrderbook.json" "${CONTRACTS_DIR}/out/queue.sol/Queue.json" > ./abis/MintEngineCpOrderbook.json
	jq -s '.[0].abi + [ .[1].abi[] | select(.type == "event") ]' "${CONTRACTS_DIR}/out/mintEngineMinterPool.sol/MintEngineMinterPool.json" "${CONTRACTS_DIR}/out/queue.sol/Queue.json" > ./abis/MintEngineMinterPool.json

	# The keyword "yield" in the generated code prevents AssemblyScript to compile
	jq '.abi | (.[].inputs[] | select(.name == "yield")).name |= "yield_"' "${CONTRACTS_DIR}/out/lsausUSD.sol/LsausUSD.json" > ./abis/LsausUSD.json

	echo -n "RegistryContract: "
	echo "${REGISTRY_CONTRACT}"

	echo -n "Stbc: "
	echo "${STBC}"

	echo -n "DaoCollateral: "
	${GET_CONTRACT} `cast keccak CONTRACT_DAO_COLLATERAL`

	echo -n "MintEngineCpOrderbook: "
	${GET_CONTRACT} `cast keccak CONTRACT_MINT_ENGINE_CP_ORDERBOOK`

	echo -n "MintEngineMinterPool: "
	${GET_CONTRACT} `cast keccak CONTRACT_MINT_ENGINE_MINTER_POOL`

	echo -n "LusDAO: "
	${GET_CONTRACT} `cast keccak CONTRACT_LUSDAO`

	echo -n "LsausUSDFactory: "
	${GET_CONTRACT} `cast keccak CONTRACT_US_BOND_FACTORY`

	echo -n "USDC: "
	echo "${USDC}"

	echo -n "StableSwap-NG Factory: "
	echo "${STABLESWAP_NG_FACTORY}"

	echo -n "Stbc Curve Pool: "
	echo "${STBC_CURVE_POOL}"

	echo -n "Stbc Curve Gauge: "
	${CALL} "${STABLESWAP_NG_FACTORY}" "get_gauge(address)(address)" "${STBC_CURVE_POOL}"

clean:
	rm -rf build/
	docker compose down -v

	rm -rf generated/
	yarn codegen

	rm -rf "${CONTRACTS_DIR}"/{broadcast,cache,out}
