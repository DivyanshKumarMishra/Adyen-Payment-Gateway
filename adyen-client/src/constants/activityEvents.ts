export const ACTIVITY_EVENTS = [
  "mousemove",   // cursor movement / hover
  "mousedown",   // mouse button press
  "mouseup",     // mouse button release
  "click",       // explicit click
  "dblclick",    // double-click
  "wheel",       // mouse wheel / trackpad scroll
  "keydown",     // key press start
  "keyup",       // key release
  "scroll",      // page/element scroll
  "touchstart",  // finger down (mobile)
  "touchmove",   // finger drag (mobile)
  "touchend",    // finger lift (mobile)
  "pointerdown", // stylus / pen input
] as const;

export type ActivityEvent = (typeof ACTIVITY_EVENTS)[number];
