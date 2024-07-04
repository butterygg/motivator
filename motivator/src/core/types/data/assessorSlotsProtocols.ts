import { AssessorSlotHyperdrive } from '@protocols/hyperdrive/types/data/assessorSlot'

/**
 * This type is a multiple type of Assessor Slots
 * When implementing a new protocol, add a new type in the union
 */
export type AssessorSlotProtocols = AssessorSlotHyperdrive | any
