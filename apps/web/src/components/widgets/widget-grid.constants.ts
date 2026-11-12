import type { GridSize } from "./widgets.types";


export const GRID_COLS: number = 12;
export const MIN_SIZE: GridSize = {width: 2, height: 1};

// Time on the same target cell before neighbours move
export const DRAG_DWELL_MS: number = 300;

// Animations (cadrage V2 §7). Keep in sync with the durations written in widget-grid.css.
// Exit animation of a removed widget: it leaves the draft once the animation is over
export const WIDGET_EXIT_MS: number = 200;
// Length of the cascade on first display: widgets added after it pop in without delay
export const WIDGET_ENTRANCE_MS: number = 700;
// Delay between two widgets of the cascade, and its cap (a long dashboard does not wait forever)
export const WIDGET_ENTRANCE_STEP_MS: number = 40;
export const WIDGET_ENTRANCE_MAX_DELAY_MS: number = 360;