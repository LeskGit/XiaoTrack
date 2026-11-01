/**
 * Layout resolution while a widget is being moved (cadrage V2 §4).
 *
 * TODO (plan V2, step 1.3)
 * findPushedSpot(placed: readonly GridRect[], widget: GridRect): GridPosition
 *   where a widget in the way goes: its own column, then right, then down
 *
 * TODO (plan V2, step 1.4)
 * resolveLayout(snapshot: readonly WidgetInstance[], movedId: string, target: GridPosition): WidgetInstance[]
 *   remove, compact, insert (pinned), push, compact
 */
