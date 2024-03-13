import {Button} from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {User} from "@/types/data/user";
import {OnChainAction} from "@/types/data/action";
import AddrAvatar from "../globals/AddrAvatar";
import {DataCard} from "./DataCard";

type Props = {
	user: User;
	onChainActions: OnChainAction[];
	offChainActions: OnChainAction[];
};

export function UserData({user}: Props) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">+</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						<AddrAvatar addressName={user.addressName} />
					</DialogTitle>
					<DialogDescription>Historical data</DialogDescription>
				</DialogHeader>
				<Label htmlFor="name" className="">
					Statistics
				</Label>
				<div className="grid gap-4 py-2">
					<div className="grid grid-cols-3 items-center gap-2">
						<DataCard title="Volume" value={user.volume} />
						<DataCard title="Pnl" value={user.pnl} />
						<DataCard title="Actions" value={user.actions} />
					</div>
				</div>

				<DialogFooter className="justify-between w-full">
					<Button variant="destructive" className="rounded-full">
						X
					</Button>
					<div className="align-top flex gap-2 w-fit">
						<Input
							placeholder="Points"
							type="number"
							className="w-32 appearance-none"
							min={0}
						/>
						<Button type="submit">Reward</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
