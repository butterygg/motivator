import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Redeem as RedeemEvent,
  SwapRWAForStbcMintEngine as SwapRWAForStbcMintEngineEvent,
  Swap as SwapEvent,
} from "../generated/DaoCollateral/DaoCollateral";
import {
  Mint,
  MintVolume,
  MintVolumeSnapshot,
  Redeem,
  Swap,
} from "../generated/schema";

export function incrementMintVolume(
  block: ethereum.Block,
  value: BigInt,
  rewards: BigInt
): void {
  let volume = MintVolume.load(Bytes.empty());
  if (volume === null) {
    volume = new MintVolume(Bytes.empty());

    volume.value = BigInt.zero();
    volume.rewards = BigInt.zero();
  }

  volume.value = volume.value.plus(value);
  volume.rewards = volume.rewards.plus(rewards);

  volume.save();

  const snapshot = new MintVolumeSnapshot(
    volume.id.concatI32(block.number.toI32())
  );

  snapshot.value = volume.value;
  snapshot.rewards = volume.rewards;
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;

  snapshot.save();
}

export function handleSwapRWAForStbcMintEngine(
  event: SwapRWAForStbcMintEngineEvent
): void {
  const id = event.transaction.hash.concatI32(event.logIndex.toI32());

  const mint = new Mint(id);

  mint.owner = event.params.stableOwner;
  mint.rwaToken = event.params.rwaToken;
  mint.rwaProvider = event.params.rwaProvider;
  mint.rwaValue = event.params.amount;
  mint.value = event.params.priceInUSD;
  mint.txHash = event.transaction.hash;
  mint.timestamp = event.block.timestamp;

  mint.save();

  incrementMintVolume(
    event.block,
    event.params.priceInUSD,
    event.params.usdaoRewards
  );
}

export function handleSwap(event: SwapEvent): void {
  const id = event.transaction.hash.concatI32(event.logIndex.toI32());

  const swap = new Swap(id);

  swap.owner = event.params.owner;
  swap.rwaToken = event.params.tokenSwapped;
  swap.rwaValue = event.params.amount;
  swap.value = event.params.amountInUSD;
  swap.txHash = event.transaction.hash;
  swap.timestamp = event.block.timestamp;

  swap.save();

  incrementMintVolume(
    event.block,
    event.params.amountInUSD,
    event.params.lusRewards
  );
}

export function handleRedeem(event: RedeemEvent): void {
  const id = event.transaction.hash.concatI32(event.logIndex.toI32());

  const redeem = new Redeem(id);

  redeem.owner = event.params.owner;
  redeem.rwaToken = event.params.collateralToken;
  redeem.rwaValue = event.params.returnedCollateral;
  redeem.value = event.params.amount;
  redeem.fee = event.params.stableFee;
  redeem.txHash = event.transaction.hash;
  redeem.timestamp = event.block.timestamp;

  redeem.save();
}
