import React from "react";
import { DataTable } from "@/components/assessor/DataTable";
import RewardedUsers from "@/components/assessor/RewardedUsers";
import { User } from "@/types/data/user";
import { Status } from "../../types/enum/status";

type Props = {};

const HomeAssessor = (props: Props) => {
  const users: User[] = [
    {
      id: "1",
      addressName: "User 1",
      volume: 100,
      pnl: 100,
      actions: 100,
      status: Status.Pending,
    },
    {
      id: "2",
      addressName: "User 2",
      volume: 100,
      pnl: 100,
      actions: 100,
      status: Status.Rewarded,
    },
    {
      id: "3",
      addressName: "User 3",
      volume: 100,
      pnl: 100,
      actions: 100,
      status: Status.Pending,
    },
  ];
  return (
    <main className="flex flex-col lg:flex-row">
      <DataTable />
      <RewardedUsers value={0} users={users} />
    </main>
  );
};

export default HomeAssessor;
