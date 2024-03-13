import { newMockEvent } from "matchstick-as";
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Approval,
  AuthorizationCanceled,
  AuthorizationUsed,
  Blacklisted,
  BlacklisterChanged,
  Burn,
  MasterMinterChanged,
  Mint,
  MinterConfigured,
  MinterRemoved,
  OwnershipTransferred,
  Pause,
  PauserChanged,
  RescuerChanged,
  Transfer,
  UnBlacklisted,
  Unpause,
} from "../generated/USDC/USDC";

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  const approvalEvent = changetype<Approval>(newMockEvent());

  approvalEvent.parameters = [];

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  );
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  );
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  );

  return approvalEvent;
}

export function createAuthorizationCanceledEvent(
  authorizer: Address,
  nonce: Bytes
): AuthorizationCanceled {
  const authorizationCanceledEvent = changetype<AuthorizationCanceled>(
    newMockEvent()
  );

  authorizationCanceledEvent.parameters = [];

  authorizationCanceledEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  );
  authorizationCanceledEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromFixedBytes(nonce))
  );

  return authorizationCanceledEvent;
}

export function createAuthorizationUsedEvent(
  authorizer: Address,
  nonce: Bytes
): AuthorizationUsed {
  const authorizationUsedEvent = changetype<AuthorizationUsed>(newMockEvent());

  authorizationUsedEvent.parameters = [];

  authorizationUsedEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  );
  authorizationUsedEvent.parameters.push(
    new ethereum.EventParam("nonce", ethereum.Value.fromFixedBytes(nonce))
  );

  return authorizationUsedEvent;
}

export function createBlacklistedEvent(_account: Address): Blacklisted {
  const blacklistedEvent = changetype<Blacklisted>(newMockEvent());

  blacklistedEvent.parameters = [];

  blacklistedEvent.parameters.push(
    new ethereum.EventParam("_account", ethereum.Value.fromAddress(_account))
  );

  return blacklistedEvent;
}

export function createBlacklisterChangedEvent(
  newBlacklister: Address
): BlacklisterChanged {
  const blacklisterChangedEvent = changetype<BlacklisterChanged>(
    newMockEvent()
  );

  blacklisterChangedEvent.parameters = [];

  blacklisterChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newBlacklister",
      ethereum.Value.fromAddress(newBlacklister)
    )
  );

  return blacklisterChangedEvent;
}

export function createBurnEvent(burner: Address, amount: BigInt): Burn {
  const burnEvent = changetype<Burn>(newMockEvent());

  burnEvent.parameters = [];

  burnEvent.parameters.push(
    new ethereum.EventParam("burner", ethereum.Value.fromAddress(burner))
  );
  burnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return burnEvent;
}

export function createMasterMinterChangedEvent(
  newMasterMinter: Address
): MasterMinterChanged {
  const masterMinterChangedEvent = changetype<MasterMinterChanged>(
    newMockEvent()
  );

  masterMinterChangedEvent.parameters = [];

  masterMinterChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newMasterMinter",
      ethereum.Value.fromAddress(newMasterMinter)
    )
  );

  return masterMinterChangedEvent;
}

export function createMintEvent(
  minter: Address,
  to: Address,
  amount: BigInt
): Mint {
  const mintEvent = changetype<Mint>(newMockEvent());

  mintEvent.parameters = [];

  mintEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  );
  mintEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  );
  mintEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return mintEvent;
}

export function createMinterConfiguredEvent(
  minter: Address,
  minterAllowedAmount: BigInt
): MinterConfigured {
  const minterConfiguredEvent = changetype<MinterConfigured>(newMockEvent());

  minterConfiguredEvent.parameters = [];

  minterConfiguredEvent.parameters.push(
    new ethereum.EventParam("minter", ethereum.Value.fromAddress(minter))
  );
  minterConfiguredEvent.parameters.push(
    new ethereum.EventParam(
      "minterAllowedAmount",
      ethereum.Value.fromUnsignedBigInt(minterAllowedAmount)
    )
  );

  return minterConfiguredEvent;
}

export function createMinterRemovedEvent(oldMinter: Address): MinterRemoved {
  const minterRemovedEvent = changetype<MinterRemoved>(newMockEvent());

  minterRemovedEvent.parameters = [];

  minterRemovedEvent.parameters.push(
    new ethereum.EventParam("oldMinter", ethereum.Value.fromAddress(oldMinter))
  );

  return minterRemovedEvent;
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  const ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  );

  ownershipTransferredEvent.parameters = [];

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  );
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  );

  return ownershipTransferredEvent;
}

export function createPauseEvent(): Pause {
  const pauseEvent = changetype<Pause>(newMockEvent());

  pauseEvent.parameters = [];

  return pauseEvent;
}

export function createPauserChangedEvent(newAddress: Address): PauserChanged {
  const pauserChangedEvent = changetype<PauserChanged>(newMockEvent());

  pauserChangedEvent.parameters = [];

  pauserChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  );

  return pauserChangedEvent;
}

export function createRescuerChangedEvent(newRescuer: Address): RescuerChanged {
  const rescuerChangedEvent = changetype<RescuerChanged>(newMockEvent());

  rescuerChangedEvent.parameters = [];

  rescuerChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newRescuer",
      ethereum.Value.fromAddress(newRescuer)
    )
  );

  return rescuerChangedEvent;
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  const transferEvent = changetype<Transfer>(newMockEvent());

  transferEvent.parameters = [];

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  );
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  );
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  );

  return transferEvent;
}

export function createUnBlacklistedEvent(_account: Address): UnBlacklisted {
  const unBlacklistedEvent = changetype<UnBlacklisted>(newMockEvent());

  unBlacklistedEvent.parameters = [];

  unBlacklistedEvent.parameters.push(
    new ethereum.EventParam("_account", ethereum.Value.fromAddress(_account))
  );

  return unBlacklistedEvent;
}

export function createUnpauseEvent(): Unpause {
  const unpauseEvent = changetype<Unpause>(newMockEvent());

  unpauseEvent.parameters = [];

  return unpauseEvent;
}
