import React from "react";
import {Button, ButtonProps} from "../../ui/button";
import {cn} from "../../../utils/utils";

type Props = {};
export const Submit = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({className, variant, size, asChild = false, ...props}, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({variant, size, className}))}
				ref={ref}
				{...props}
			/>
		);
	},
);
