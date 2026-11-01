/**
 * Pixels → grid cell conversion while dragging (cadrage V2 §3.2).
 * Pure: the DOM measurement happens in the hook, not here.
 *
 * TODO (plan V2, step 1.5)
 * pointToCell(...): GridPosition
 *   inputs: pointer position, grab offset, grid rect, column and row steps, widget size
 *   rule: round to the nearest cell, then clamp to 0 ≤ x ≤ 12 − w and y ≥ 0
 */
