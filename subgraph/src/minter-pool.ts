import { BigInt, store } from "@graphprotocol/graph-ts";
import {
  Deposit as DepositEvent,
  OfferCreated as OfferCreatedEvent,
  OfferTaken as OfferTakenEvent,
  OfferModified as OfferModifiedEvent,
  OfferCancelled as OfferCancelledEvent,
  Withdraw as WithdrawEvent,
} from "../generated/MintEngineMinterPool/MintEngineMinterPool";
import { MintEngineOffer, MintEngineOfferComponent } from "../generated/schema";
import {
  getMintEngineOffer,
  incrementMintEngineLiquidity,
} from "./collateral-providers";

export function handleDeposit(event: DepositEvent): void {
  // Assumes no mint token can be used as collateral token
  const id = event.params.token.concatI32(event.params.offerId.toI32());

  if (event.params.amount.isZero()) {
    throw new Error(
      `Offer component ${id
        .concat(event.params.caller)
        .toHexString()} has zero value`
    );
  }

  let offer = MintEngineOffer.load(id);
  if (offer === null) {
    offer = new MintEngineOffer(id);

    offer.offerId = event.params.offerId;
    offer.side = "MINT";
    offer.status = "PENDING";
    offer.token = event.params.token;
    offer.totalValue = BigInt.zero();
    offer.remainingValue = offer.totalValue;
  } else {
    if (offer.side != "MINT") {
      throw new Error(
        `Offer ${offer.id.toHexString()} is not on MINT side (${offer.side})`
      );
    }

    if (offer.status != "PENDING") {
      throw new Error(
        `Offer ${offer.id.toHexString()} is not PENDING (${offer.status})`
      );
    }
  }

  offer.totalValue = offer.totalValue.plus(event.params.amount);
  offer.remainingValue = offer.totalValue;

  offer.save();

  let component = MintEngineOfferComponent.load(
    offer.id.concat(event.params.caller)
  );
  if (component === null) {
    component = new MintEngineOfferComponent(
      offer.id.concat(event.params.caller)
    );

    component.offer = offer.id;
    component.owner = event.params.caller;
    component.value = BigInt.zero();
  }

  component.value = component.value.plus(event.params.amount);
  component.txHash = event.transaction.hash;
  component.timestamp = event.block.timestamp;

  component.save();

  incrementMintEngineLiquidity(
    event.block,
    event.params.token,
    "MINT",
    event.params.amount
  );
}

export function handleWithdraw(event: WithdrawEvent): void {
  // Assumes a user can only withdraw while in PENDING status
  const offer = getMintEngineOffer(
    event.params.token,
    event.params.offerId,
    "MINT",
    "PENDING"
  );

  offer.totalValue = offer.totalValue.minus(event.params.amount);
  offer.remainingValue = offer.totalValue;

  if (offer.totalValue.lt(BigInt.zero())) {
    throw new Error(
      `Offer ${offer.id.toHexString()} total value is negative (${offer.totalValue.toString()})`
    );
  }

  store.remove(
    "MintEngineOfferComponent",
    offer.id.concat(event.params.caller).toHexString()
  );

  if (offer.totalValue.isZero()) {
    const components = offer.components.load();
    if (components.length !== 0)
      throw new Error(`Offer ${offer.id.toHexString()} still has components`);

    store.remove("MintEngineOffer", offer.id.toHexString());
  } else {
    offer.save();
  }

  incrementMintEngineLiquidity(
    event.block,
    event.params.token,
    "MINT",
    event.params.amount.neg()
  );
}

export function handleOfferCreated(event: OfferCreatedEvent): void {
  const offer = getMintEngineOffer(
    event.params.offer.token,
    event.params.offer.offerId,
    "MINT",
    "PENDING"
  );

  offer.status = "OPEN";

  offer.save();
}

export function handleOfferModified(event: OfferModifiedEvent): void {
  const offer = getMintEngineOffer(
    event.params.offer.token,
    event.params.offer.offerId,
    "MINT",
    "OPEN"
  );

  const delta = event.params.offer.amount.minus(offer.remainingValue);
  offer.remainingValue = event.params.offer.amount;

  if (offer.remainingValue.isZero())
    throw new Error(`Offer ${offer.id.toHexString()} modified to zero value`);

  offer.save();

  incrementMintEngineLiquidity(
    event.block,
    event.params.offer.token,
    "MINT",
    delta
  );
}

export function handleOfferTaken(event: OfferTakenEvent): void {
  const offer = getMintEngineOffer(
    event.params.offer.token,
    event.params.offer.offerId,
    "MINT",
    "OPEN"
  );

  const delta = offer.remainingValue.neg();
  offer.status = "FILLED";
  offer.remainingValue = BigInt.zero();

  offer.save();

  incrementMintEngineLiquidity(
    event.block,
    event.params.offer.token,
    "MINT",
    delta
  );
}

export function handleOfferCancelled(event: OfferCancelledEvent): void {
  const offer = getMintEngineOffer(
    event.params.offer.token,
    event.params.offer.offerId,
    "MINT",
    "OPEN"
  );

  offer.status = "CANCELLED";

  offer.save();

  incrementMintEngineLiquidity(
    event.block,
    event.params.offer.token,
    "MINT",
    offer.remainingValue.neg()
  );
}
