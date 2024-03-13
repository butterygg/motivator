import {
  NewBond as NewBondEvent,
  RemoveBond as RemoveBondEvent,
} from "../generated/LsausUSDFactory/LsausUSDFactory";
import {
  LsausUSD as LsausUSDABI,
  Transfer as TransferEvent,
} from "../generated/templates/LsausUSD/LsausUSD";
import { LsausUSD as LsausUSDTemplate } from "../generated/templates";
import { Bond } from "../generated/schema";
import { Address, BigInt, store } from "@graphprotocol/graph-ts";
import { incrementTokenBalance, incrementTokenSupply } from "./stbc";

export function handleNewBond(event: NewBondEvent): void {
  const contract = LsausUSDABI.bind(event.params.bond);

  const bond = new Bond(event.params.bond);

  bond.name = contract.name();
  bond.symbol = contract.symbol();
  bond.startBlock = contract.getStartBlock();
  bond.endBlock = contract.getEndBlock();

  bond.save();

  LsausUSDTemplate.create(event.params.bond);
}

export function handleRemoveBond(event: RemoveBondEvent): void {
  store.remove("Bond", event.params.bond.toHexString());
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
    const value = isMint ? event.params.value : event.params.value.neg();
    incrementTokenSupply(event.block, event.address, value);
  }
}
