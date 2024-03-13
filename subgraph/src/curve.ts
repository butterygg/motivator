import {
  CurvePool,
  TokenExchange as TokenExchangeEvent,
} from "../generated/templates/CurvePool/CurvePool";
import {
  CurveGauge,
  Transfer as TransferEvent,
} from "../generated/templates/CurveGauge/CurveGauge";
import { incrementTokenBalance, incrementTokenSupply } from "./stbc";
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { LpDeposit, LpSwap } from "../generated/schema";

export function saveLpDeposit(
  block: ethereum.Block,
  txHash: Bytes,
  logIndex: BigInt,
  pool: Address,
  owner: Address,
  value: BigInt
): void {
  if (owner.equals(Address.zero())) return;

  const withdrawal = value.lt(BigInt.zero());
  const deposit = new LpDeposit(
    txHash
      .concatI32(logIndex.toI32())
      .concat(Bytes.fromI32(withdrawal ? -1 : 1))
  );

  deposit.owner = owner;
  deposit.pool = pool;
  deposit.value = value;
  deposit.txHash = txHash;
  deposit.timestamp = block.timestamp;

  deposit.save();
}

export function handleTokenExchange(event: TokenExchangeEvent): void {
  const curvePool = CurvePool.bind(event.address);

  const swap = new LpSwap(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  swap.owner = event.params.buyer;
  swap.pool = event.address;
  swap.from = curvePool.coins(event.params.sold_id);
  swap.to = curvePool.coins(event.params.bought_id);
  swap.valueFrom = event.params.tokens_sold;
  swap.valueTo = event.params.tokens_bought;
  swap.txHash = event.transaction.hash;
  swap.timestamp = event.block.timestamp;

  swap.save();
}

export function handleTransfer(event: TransferEvent): void {
  if (event.params.value.equals(BigInt.zero())) return;

  const curveGauge = CurveGauge.bind(event.address);
  const curvePool = curveGauge.lp_token();

  saveLpDeposit(
    event.block,
    event.transaction.hash,
    event.logIndex,
    curvePool,
    event.params.from,
    event.params.value.neg()
  );
  saveLpDeposit(
    event.block,
    event.transaction.hash,
    event.logIndex,
    curvePool,
    event.params.to,
    event.params.value
  );

  incrementTokenBalance(
    event.block,
    event.address,
    event.params.from,
    event.params.value.neg()
  );
  incrementTokenBalance(
    event.block,
    event.address,
    event.params.to,
    event.params.value
  );

  const isMint = event.params.from.equals(Address.zero());
  const isBurn = event.params.to.equals(Address.zero());
  if (isMint !== isBurn) {
    incrementTokenSupply(
      event.block,
      event.address,
      isMint ? event.params.value : event.params.value.neg()
    );
  }
}
