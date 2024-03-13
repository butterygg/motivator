import React from "react";
import {DataTable} from "@/components/assessor/DataTable";

type Props = {};

const HomeAssessor = (props: Props) => {
	return (
		<main>
			<h1>Assessor</h1>
			<DataTable />
		</main>
	);
};

export default HomeAssessor;
