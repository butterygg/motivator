"""
Hello
"""

import csv
import json
import pdb
import sys
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal, getcontext
from enum import Enum, auto
from typing import Dict, Iterator, List

# Start block: 5663018, Apr-09-2024 06:56:48 PM +UTC.
START_TIME = datetime(2024, 4, 9, 6, 0).replace(tzinfo=timezone.utc)
# End: at noon Eastern on Thu 17th.
END_TIME = datetime(2024, 4, 17, 16, 0).replace(tzinfo=timezone.utc)


class EventType(Enum):
    "Hello"
    OpenLong = auto()
    CloseLong = auto()
    OpenShort = auto()
    CloseShort = auto()
    Initialize = auto()
    AddLiquidity = auto()
    RemoveLiquidity = auto()


EVENT_TYPE_TYPE = {
    EventType.OpenLong: "longs",
    EventType.CloseLong: "longs",
    EventType.OpenShort: "shorts",
    EventType.CloseShort: "shorts",
    EventType.Initialize: "lps",
    EventType.AddLiquidity: "lps",
    EventType.RemoveLiquidity: "lps",
}


@dataclass
class Event:
    "Hello"
    _type: EventType
    block_timestamp: datetime
    block_number: int
    address: str
    base_amount: int


@dataclass
class Row:
    "Hello"
    contract: str
    timestamp: datetime
    address: str
    volume_longs: int
    volume_shorts: int
    volume_lps: int
    action_count_longs: int
    action_count_shorts: int
    action_count_lps: int
    _id: uuid.UUID = field(default_factory=uuid.uuid4)

    def to_list(self):
        return [
            self._id,
            self.contract,
            self.timestamp,
            self.address,
            self.action_count_longs,
            self.action_count_shorts,
            self.action_count_lps,
            self.volume_longs,
            self.volume_shorts,
            self.volume_lps,
        ]

    @staticmethod
    def header():
        return [
            "id",
            "contract",
            "timestamp",
            "address",
            "action_count_longs",
            "action_count_shorts",
            "action_count_lps",
            "volume_longs",
            "volume_shorts",
            "volume_lps",
        ]


def to_decimal(u256: str) -> Decimal:
    getcontext().prec = 78  # U256 can have up to 78 decimal digits
    u256_decimal = Decimal(u256)
    return u256_decimal / Decimal("1000000000000000000")


def to_event(data: Dict) -> Event:
    return Event(
        **{
            **data,
            "_type": EventType[data["_type"]],
            "block_timestamp": to_datetime(data["block_timestamp"]),
            "base_amount": to_decimal(data["base_amount"]),
        }
    )


def to_datetime(iso8601: str) -> datetime:
    return datetime.fromisoformat(iso8601.replace("Z", "+00:00"))


def aggregate_period(
    events: Dict[str, List[Event]], start_time: datetime, end_time: datetime
) -> Iterator[Row]:
    aggregates = defaultdict(
        lambda: {
            "action_count_longs": 0,
            "action_count_shorts": 0,
            "action_count_lps": 0,
            "volume_longs": 0,
            "volume_shorts": 0,
            "volume_lps": 0,
        }
    )

    for cname, cevents in events.items():
        for event in cevents:
            if start_time < event.block_timestamp <= end_time:
                key = (cname, event.block_timestamp, event.address)
                aggregates[key][f"action_count_{EVENT_TYPE_TYPE[event._type]}"] += 1
                aggregates[key][
                    f"volume_{EVENT_TYPE_TYPE[event._type]}"
                ] += event.base_amount

    for (contract, timestamp, address), agg in aggregates.items():
        yield Row(contract=contract, timestamp=timestamp, address=address, **agg)


def aggregate(events: Dict[str, List[Event]]) -> Iterator[Row]:
    start_time = START_TIME
    end_time = start_time + timedelta(hours=1)
    while end_time <= END_TIME:
        yield from aggregate_period(events, start_time, end_time)

        start_time = end_time
        end_time += timedelta(hours=1)


def main():
    with open("./events.json", "r", encoding="utf-8") as f:
        events_data = json.load(f)
    events = {
        cname: [to_event(e) for e in c_events_data]
        for cname, c_events_data in events_data.items()
    }

    with open("./rows.csv", mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(Row.header())
        for row in aggregate(events):
            writer.writerow(row.to_list())


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # This captures the exception and starts a post-mortem debugging
        info = sys.exc_info()
        pdb.post_mortem(info[2])  # info[2] is the traceback object
        raise
