import { Address, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/LusDAO/LusDAO";
import { LpRewardsClaim } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  if (event.params.value.equals(BigInt.zero())) return;

  const curveGauge = Address.fromBytes(
    dataSource.context().getBytes("curveGauge")
  );
  if (!event.params.from.equals(curveGauge)) return;

  const id = event.transaction.hash.concatI32(event.logIndex.toI32());

  const claim = new LpRewardsClaim(id);

  claim.owner = event.params.to;
  claim.pool = Address.fromBytes(dataSource.context().getBytes("curvePool"));
  claim.token = event.address;
  claim.value = event.params.value;
  claim.txHash = event.transaction.hash;
  claim.timestamp = event.block.timestamp;

  claim.save();
}
