import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  OfferCreated as OfferCreatedEvent,
  OfferTaken as OfferTakenEvent,
  OfferModified as OfferModifiedEvent,
  OfferCancelled as OfferCancelledEvent,
} from "../generated/MintEngineCpOrderbook/MintEngineCpOrderbook";
import {
  MintEngineLiquidity,
  MintEngineLiquiditySnapshot,
  MintEngineOffer,
  MintEngineOfferComponent,
} from "../generated/schema";

export function getMintEngineOffer(
  token: Address,
  offerId: BigInt,
  side: string,
  status: string,
  owner: Address | null = null
): MintEngineOffer {
  const id = token.concatI32(offerId.toI32());

  const offer = MintEngineOffer.load(id);

  if (offer === null) throw new Error(`Offer ${id.toHexString()} not found`);

  if (offer.side != side) {
    throw new Error(
      `Offer ${offer.id.toHexString()} is not on ${side} side (${offer.side})`
    );
  }

  if (offer.status != status) {
    throw new Error(
      `Offer ${offer.id.toHexString()} is not in ${status} status (${
        offer.status
      })`
    );
  }

  if (owner !== null) {
    const components = offer.components.load();
    if (components.length !== 1 || !components[0].owner.equals(owner)) {
      throw new Error(
        `Offer ${offer.id.toHexString()} is not from owner ${owner.toHexString()}`
      );
    }
  }

  return offer;
}

export function incrementMintEngineLiquidity(
  block: ethereum.Block,
  token: Address,
  side: string,
  value: BigInt
): void {
  let liquidity = MintEngineLiquidity.load(token);
  if (liquidity === null) {
    liquidity = new MintEngineLiquidity(token);

    liquidity.side = side;
    liquidity.token = token;
    liquidity.value = BigInt.zero();
  } else {
    if (liquidity.side != side) {
      throw new Error(
        `Liquidity ${liquidity.id.toHexString()} is not on ${side} side (${
          liquidity.side
        })`
      );
    }
  }

  liquidity.value = liquidity.value.plus(value);

  if (liquidity.value.lt(BigInt.zero())) {
    throw new Error(
      `Liquidity ${token.toHexString()} is negative (${liquidity.value.toString()})`
    );
  }

  liquidity.save();

  const snapshot = new MintEngineLiquiditySnapshot(
    liquidity.id.concatI32(block.number.toI32())
  );

  snapshot.side = liquidity.side;
  snapshot.token = liquidity.token;
  snapshot.value = liquidity.value;
  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;

  snapshot.save();
}

export function handleOfferCreated(event: OfferCreatedEvent): void {
  // Assumes no collateral token can be used as mint token
  const id = event.params.offer.token.concatI32(
    event.params.offer.offerId.toI32()
  );

  if (event.params.offer.amount.isZero())
    throw new Error(`Offer ${id.toHexString()} has zero value`);

  const offer = new MintEngineOffer(id);

  offer.offerId = event.params.offer.offerId;
  offer.side = "PROVIDE";
  offer.status = "OPEN";
  offer.token = event.params.offer.token;
  offer.totalValue = event.params.offer.amount;
  offer.remainingValue = offer.totalValue;

  offer.save();

  // Provide-side offers only ever contain one component
  const component = new MintEngineOfferComponent(
    offer.id.concat(event.params.offer.owner)
  );

  component.offer = offer.id;
  component.owner = event.params.offer.owner;
  component.value = event.params.offer.amount;
  component.txHash = event.transaction.hash;
  component.timestamp = event.block.timestamp;

  component.save();

  incrementMintEngineLiquidity(
    event.block,
    event.params.offer.token,
    offer.side,
    offer.remainingValue
  );
}

export function handleOfferModified(event: OfferModifiedEvent): void {
  const offer = getMintEngineOffer(
    event.params.offer.token,
    event.params.offer.offerId,
    "PROVIDE",
    "OPEN",
    event.params.offer.owner
  );

  const delta = event.params.offer.amount.minus(offer.remainingValue);
  offer.remainingValue = event.params.offer.amount;

  if (offer.remainingValue.isZero())
    throw new Error(`Offer ${offer.id.toHexString()} modified to zero value`);

  offer.save();

  incrementMintEngineLiquidity(
    event.block,
    event.params.offer.token,
    offer.side,
    delta
  );
}

export function handleOfferTaken(event: OfferTakenEvent): void {
  const offer = getMintEngineOffer(
    event.params.offer.token,
    event.params.offer.offerId,
    "PROVIDE",
    "OPEN",
    event.params.offer.owner
  );

  const delta = offer.remainingValue.neg();
  offer.status = "FILLED";
  offer.remainingValue = BigInt.zero();

  offer.save();

  incrementMintEngineLiquidity(
    event.block,
    event.params.offer.token,
    offer.side,
    delta
  );
}

export function handleOfferCancelled(event: OfferCancelledEvent): void {
  const offer = getMintEngineOffer(
    event.params.offer.token,
    event.params.offer.offerId,
    "PROVIDE",
    "OPEN",
    event.params.offer.owner
  );

  offer.status = "CANCELLED";

  offer.save();

  incrementMintEngineLiquidity(
    event.block,
    event.params.offer.token,
    offer.side,
    offer.remainingValue.neg()
  );
}
