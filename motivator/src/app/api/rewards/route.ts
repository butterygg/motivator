// Send Rewards to specifics users based on their actions
/**
 *
 * @param request Will contain an Array of [{address: string, value: number}]
 * @param response Send the status of the transaction
 */
export async function POST(request: Request) {
  // Get the address of the assessor

  // Get the actual list of addresses provided to the assessors - Security check

  // Add in the dataTable Rewards the value of the rewards for each user and add the Address of the Accessor

  // Fetch the list of users from the database

  // Return the list of users
  return Response.json({ status: "ok" });
  // return {users: []};
}
