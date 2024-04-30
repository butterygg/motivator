"""
Hello
"""

import json
import os
import pdb
import sys
from dataclasses import asdict, dataclass
from enum import Enum, auto

from moralis import evm_api
from web3 import Web3

# Prev values: 5663018
START_BLOCK = int(os.environ["START_BLOCK"])
# Prev values: 5726087, 5775406
END_BLOCK = int(os.environ["END_BLOCK"])


MORALIS_API_KEY = os.environ["MORALIS_API_KEY"]

CONTRACT = {
    "4626": [
        "0x392839da0dacac790bd825c81ce2c5e264d793a8",
        "0x0436b07823da988484b70309b0d1b509eadd2173",
        "0xb932f8085399c228b16a9f7fc3219d47ffa2810d",
    ],
    "stETH": [
        "0xff33bd6d7ed4119c99c310f3e5f0fa467796ee23",
        "0x72e19347512c194a6812c72934bf0439ffb31a26",
        "0x4e38fd41c03ff11b3426efae53138b86116797b8",
    ],
}


class EventType(Enum):
    "Hello"
    OpenLong = auto()
    CloseLong = auto()
    OpenShort = auto()
    CloseShort = auto()
    Initialize = auto()
    AddLiquidity = auto()
    RemoveLiquidity = auto()


@dataclass
class EventStruct:
    "Hello"
    abi: dict
    address_key: str

    def topic(self, web3: Web3) -> str:
        event_name = self.abi["name"]
        input_types = ",".join([input["type"] for input in self.abi["inputs"]])
        event_signature = f"{event_name}({input_types})"
        return web3.keccak(text=event_signature).hex()


EVENTS_STRUCT = {
    EventType.OpenLong: EventStruct(
        abi={
            "anonymous": False,
            "inputs": [
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "trader",
                    "type": "address",
                },
                {
                    "indexed": True,
                    "internalType": "uint256",
                    "name": "assetId",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "maturityTime",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "baseAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "vaultShareAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "bool",
                    "name": "asBase",
                    "type": "bool",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "bondAmount",
                    "type": "uint256",
                },
            ],
            "name": "OpenLong",
            "type": "event",
        },
        address_key="trader",
    ),
    EventType.CloseLong: EventStruct(
        abi={
            "anonymous": False,
            "inputs": [
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "trader",
                    "type": "address",
                },
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "destination",
                    "type": "address",
                },
                {
                    "indexed": True,
                    "internalType": "uint256",
                    "name": "assetId",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "maturityTime",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "baseAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "vaultShareAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "bool",
                    "name": "asBase",
                    "type": "bool",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "bondAmount",
                    "type": "uint256",
                },
            ],
            "name": "CloseLong",
            "type": "event",
        },
        address_key="trader",
    ),
    EventType.OpenShort: EventStruct(
        abi={
            "anonymous": False,
            "inputs": [
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "trader",
                    "type": "address",
                },
                {
                    "indexed": True,
                    "internalType": "uint256",
                    "name": "assetId",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "maturityTime",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "baseAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "vaultShareAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "bool",
                    "name": "asBase",
                    "type": "bool",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "baseProceeds",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "bondAmount",
                    "type": "uint256",
                },
            ],
            "name": "OpenShort",
            "type": "event",
        },
        address_key="trader",
    ),
    EventType.CloseShort: EventStruct(
        abi={
            "anonymous": False,
            "inputs": [
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "trader",
                    "type": "address",
                },
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "destination",
                    "type": "address",
                },
                {
                    "indexed": True,
                    "internalType": "uint256",
                    "name": "assetId",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "maturityTime",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "baseAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "vaultShareAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "bool",
                    "name": "asBase",
                    "type": "bool",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "basePayment",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "bondAmount",
                    "type": "uint256",
                },
            ],
            "name": "CloseShort",
            "type": "event",
        },
        address_key="trader",
    ),
    EventType.Initialize: EventStruct(
        abi={
            "anonymous": False,
            "inputs": [
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "provider",
                    "type": "address",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "lpAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "baseAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "vaultShareAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "bool",
                    "name": "asBase",
                    "type": "bool",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "apr",
                    "type": "uint256",
                },
            ],
            "name": "Initialize",
            "type": "event",
        },
        address_key="provider",
    ),
    EventType.AddLiquidity: EventStruct(
        abi={
            "anonymous": False,
            "inputs": [
                {
                    "indexed": True,
                    "name": "provider",
                    "type": "address",
                    "internal_type": "address",
                },
                {
                    "indexed": False,
                    "name": "lpAmount",
                    "type": "uint256",
                    "internal_type": "uint256",
                },
                {
                    "indexed": False,
                    "name": "baseAmount",
                    "type": "uint256",
                    "internal_type": "uint256",
                },
                {
                    "indexed": False,
                    "name": "vaultShareAmount",
                    "type": "uint256",
                    "internal_type": "uint256",
                },
                {
                    "indexed": False,
                    "name": "asBase",
                    "type": "bool",
                    "internal_type": "bool",
                },
                {
                    "indexed": False,
                    "name": "lpSharePrice",
                    "type": "uint256",
                    "internal_type": "uint256",
                },
            ],
            "name": "AddLiquidity",
            "type": "event",
        },
        address_key="provider",
    ),
    EventType.RemoveLiquidity: EventStruct(
        abi={
            "anonymous": False,
            "inputs": [
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "provider",
                    "type": "address",
                },
                {
                    "indexed": True,
                    "internalType": "address",
                    "name": "destination",
                    "type": "address",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "lpAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "baseAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "vaultShareAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "bool",
                    "name": "asBase",
                    "type": "bool",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "withdrawalShareAmount",
                    "type": "uint256",
                },
                {
                    "indexed": False,
                    "internalType": "uint256",
                    "name": "lpSharePrice",
                    "type": "uint256",
                },
            ],
            "name": "RemoveLiquidity",
            "type": "event",
        },
        address_key="provider",
    ),
}


@dataclass
class EventData:
    "Hello"
    _type: EventType
    block_timestamp: str
    block_number: int
    address: str
    base_amount: int


def result_and_cursor(
    web3: Web3, contract_addr: str, event_type: EventType, event_struct, cursor=None
):
    params = {
        "chain": "sepolia",
        "order": "ASC",
        "from_block": START_BLOCK,
        "to_block": END_BLOCK,
        "topic": event_struct.topic(web3),
        "address": contract_addr,
    }
    if cursor:
        params["cursor"] = cursor

    result = evm_api.events.get_contract_events(
        api_key=MORALIS_API_KEY,
        body=event_struct.abi,
        params=params,
    )

    return [
        EventData(
            _type=event_type,
            block_timestamp=e["block_timestamp"],
            block_number=e["block_number"],
            address=e["data"][event_struct.address_key],
            base_amount=e["data"]["baseAmount"],
        )
        for e in result["result"]
    ], result["cursor"]


class CustomEncoder(json.JSONEncoder):
    "Hello"

    def default(self, o):
        if isinstance(o, EventType):
            return o.name
        return json.JSONEncoder.default(self, o)


def events():
    web3 = Web3()
    es = {}

    for contract_name, contract_addrs in CONTRACT.items():
        es[contract_name] = []
        for contract_addr in contract_addrs:
            for event_type, event_struct in EVENTS_STRUCT.items():
                new_events, cursor = result_and_cursor(
                    web3, contract_addr, event_type, event_struct
                )
                es[contract_name] += new_events

                while cursor:
                    new_events, cursor = result_and_cursor(
                        web3, contract_addr, event_type, event_struct, cursor
                    )
                    es[contract_name] += new_events

    return es


def main():
    es = events()

    with open("events.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                cname: [asdict(cevent) for cevent in cevents]
                for cname, cevents in es.items()
            },
            f,
            cls=CustomEncoder,
            indent=4,
        )


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # This captures the exception and starts a post-mortem debugging
        info = sys.exc_info()
        pdb.post_mortem(info[2])  # info[2] is the traceback object
        raise
