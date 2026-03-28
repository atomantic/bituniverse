// Keyboard shortcut action types
export const KEYBOARD_ACTIONS = {
  TOGGLE_CONTROLS: "TOGGLE_CONTROLS",
  TOGGLE_INFO: "TOGGLE_INFO",
  NAVIGATE_LEFT: "NAVIGATE_LEFT",
  NAVIGATE_RIGHT: "NAVIGATE_RIGHT",
  RANDOM_JUMP: "RANDOM_JUMP",
  ZOOM_TO_CENTER: "ZOOM_TO_CENTER",
  RESET_CAMERA: "RESET_CAMERA",
  ZOOM_IN: "ZOOM_IN",
  ZOOM_OUT: "ZOOM_OUT",
  TOGGLE_TOUR: "TOGGLE_TOUR",
  TOGGLE_KEY_LOOKUP: "TOGGLE_KEY_LOOKUP",
  SHARE_LOCATION: "SHARE_LOCATION",
  TOGGLE_HISTORY: "TOGGLE_HISTORY",
  TOGGLE_BRUTE_FORCE: "TOGGLE_BRUTE_FORCE",
};

// Keyboard shortcut configuration
export const KEYBOARD_SHORTCUTS = {
  [KEYBOARD_ACTIONS.TOGGLE_CONTROLS]: ["c"],
  [KEYBOARD_ACTIONS.TOGGLE_INFO]: ["i"],
  [KEYBOARD_ACTIONS.NAVIGATE_LEFT]: ["arrowleft"],
  [KEYBOARD_ACTIONS.NAVIGATE_RIGHT]: ["arrowright"],
  [KEYBOARD_ACTIONS.RANDOM_JUMP]: ["j"],
  [KEYBOARD_ACTIONS.ZOOM_TO_CENTER]: ["m"],
  [KEYBOARD_ACTIONS.RESET_CAMERA]: ["o"],
  [KEYBOARD_ACTIONS.ZOOM_IN]: ["enter", " "],
  [KEYBOARD_ACTIONS.ZOOM_OUT]: ["escape", "backspace"],
  [KEYBOARD_ACTIONS.TOGGLE_TOUR]: ["t"],
  [KEYBOARD_ACTIONS.TOGGLE_KEY_LOOKUP]: ["f"],
  [KEYBOARD_ACTIONS.SHARE_LOCATION]: ["s"],
  [KEYBOARD_ACTIONS.TOGGLE_HISTORY]: ["h"],
  [KEYBOARD_ACTIONS.TOGGLE_BRUTE_FORCE]: ["b"],
};

// Action handlers type
/**
 * @typedef {function(string): void} ActionHandler
 */

// Create keyboard event listener
export function createKeyboardListener(handlers) {
  const handleKeyPress = (event) => {
    const key = event.key.toLowerCase();

    // Find matching action for the pressed key
    const action = Object.entries(KEYBOARD_SHORTCUTS).find(([_, keys]) =>
      keys.includes(key)
    )?.[0];

    // Call handler if action found
    if (action && handlers[action]) {
      handlers[action](action);
    }
  };

  return handleKeyPress;
}

// Helper to check if a key is a navigation key
export function isNavigationKey(key) {
  return [
    KEYBOARD_ACTIONS.NAVIGATE_LEFT,
    KEYBOARD_ACTIONS.NAVIGATE_RIGHT,
  ].includes(key);
}
