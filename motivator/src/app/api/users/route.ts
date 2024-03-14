export function handlingUsers(req: any, res: any) {
	res.status(200).json({message: "Handling Users"});
}

// Fetch the users list from the database
/**
 *
 * @param request Will contain the Address of the Assessor wallet
 * @param response Will contain the list of users for this assessor
 */
export async function GET(request: Request) {
	// Get the address of the assessor

	// Define a Randomization function to randomize the list of users

	// Fetch the list of users from the database

	// Return the list of users

	return {users: []};
}
