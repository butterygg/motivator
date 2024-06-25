/** This type is to define an Answer type in return of each call to DB
 * !Need to be upgraded in the future
 * it is used in the server/actions
 * and it is not optimal
 */
export type Answer = {
    status: string
    message: string
    res?: any
}
