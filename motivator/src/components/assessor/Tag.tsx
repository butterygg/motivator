import React from "react";
import { Status } from "@/types/enum/status";

type Props = {
  value: Status;
};

export const Tag = ({ value }: Props) => {
  switch (value) {
    case Status.Pending:
      return <></>;
    case Status.Rewarded:
      return (
        <div className="bg-green-200 text-green-800 rounded-full px-2 py-1 text-xs ">
          Rewarded
        </div>
      );
    case Status.NullReward:
      return (
        <div className="bg-red-200 text-red-800 rounded-full px-2 py-1 text-xs">
          Rejected
        </div>
      );
  }
};
