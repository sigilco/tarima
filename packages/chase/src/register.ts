import type { HandlerRegistry } from '@tarima/engine/types'
import { chaseHandlers } from './handlers'
import type { ChaseLlm } from './llm'
import { CHASE_DELIVERABLES } from './template'

/** Register the chase-deliverables template's step handlers with a runner. */
export function registerChase(llm: ChaseLlm): HandlerRegistry {
  return chaseHandlers(llm)
}

export { CHASE_DELIVERABLES }
