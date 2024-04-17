"""
Hello
"""

import os
import pdb
import sys
from dataclasses import dataclass
from enum import Enum, auto

from moralis import evm_api

START_BLOCK = 5663018
END_BLOCK = 5718866

MORALIS_API_KEY = os.environ["MORALIS_API_KEY"]

CONTRACT = {"4626": "0x392839da0dacac790bd825c81ce2c5e264d793a8"}


class EventType(Enum):
    AddLiquidity = auto()


EVENTS_STRUCT = {
    EventType.AddLiquidity: {
        "topic": "0xa59daf574c5c8db34377de83bceea2aa1433cc506d656f5e8f46e5f4b5c58a86",
        "abi": {
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
        "address_key": "provider",
    }
}


@dataclass
class EventData:
    "Hello"
    _type: EventType
    block_timestamp: str
    block_number: int
    address: str
    base_amount: int


def result_and_cursor(event_type: EventType, event_struct, cursor=None):
    params = {
        "chain": "sepolia",
        "order": "ASC",
        "from_block": START_BLOCK,
        "to_block": END_BLOCK,
        "topic": event_struct["topic"],
        "address": CONTRACT["4626"],
    }
    if cursor:
        params["cursor"] = cursor

    result = evm_api.events.get_contract_events(
        api_key=MORALIS_API_KEY,
        body=event_struct["abi"],
        params=params,
    )

    return [
        EventData(
            _type=event_type,
            block_timestamp=e["block_timestamp"],
            block_number=e["block_number"],
            address=e["data"][event_struct["address_key"]],
            base_amount=e["data"]["baseAmount"],
        )
        for e in result["result"]
    ], result["cursor"]


def main():
    events = []

    for event_type, event_struct in EVENTS_STRUCT.items():
        new_events, cursor = result_and_cursor(event_type, event_struct)
        events += new_events

        while cursor:
            new_events, cursor = result_and_cursor(event_type, event_struct, cursor)
            events += new_events

    print(len(events))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # This captures the exception and starts a post-mortem debugging
        info = sys.exc_info()
        pdb.post_mortem(info[2])  # info[2] is the traceback object
