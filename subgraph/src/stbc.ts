import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/Stbc/Stbc";
import {
  TokenBalance,
  TokenBalanceSnapshot,
  TokenSupply,
  TokenSupplySnapshot,
} from "../generated/schema";

export function incrementTokenBalance(
  block: ethereum.Block,
  token: Address,
  owner: Address,
  value: BigInt
): void {
  if (owner.equals(Address.zero())) return;

  let balance = TokenBalance.load(token.concat(owner));
  if (balance === null) {
    balance = new TokenBalance(token.concat(owner));

    balance.token = token;
    balance.owner = owner;
    balance.value = BigInt.zero();
  }

  balance.value = balance.value.plus(value);

  if (balance.value.lt(BigInt.zero())) {
    throw new Error(
      `Token ${token.toHexString()} balance for ${owner.toHexString()} is negative (${balance.value.toString()})`
    );
  }

  balance.save();

  const snapshot = new TokenBalanceSnapshot(
    balance.id.concatI32(block.number.toI32())
  );

  snapshot.token = balance.token;
  snapshot.owner = balance.owner;
  snapshot.value = balance.value;
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;

  snapshot.save();
}

export function incrementTokenSupply(
  block: ethereum.Block,
  token: Address,
  value: BigInt
): void {
  let supply = TokenSupply.load(token);
  if (supply === null) {
    supply = new TokenSupply(token);

    supply.token = token;
    supply.value = BigInt.zero();
  }

  supply.value = supply.value.plus(value);

  if (supply.value.lt(BigInt.zero())) {
    throw new Error(
      `Token ${token.toHexString()} supply is negative (${supply.value.toString()})`
    );
  }

  supply.save();

  const snapshot = new TokenSupplySnapshot(
    supply.id.concatI32(block.number.toI32())
  );

  snapshot.token = supply.token;
  snapshot.value = supply.value;
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;

  snapshot.save();
}

export function handleTransfer(event: TransferEvent): void {
  if (event.params.value.equals(BigInt.zero())) return;

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
