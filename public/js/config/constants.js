/**
 * @fileoverview Application constants for chat application
 * Contains DOM element references, chat types, configuration values, and other constants
 */

// ==================== DOM ELEMENT SELECTORS ====================
/**
 * DOM element selectors used throughout the application
 * @namespace DOM
 */
export const DOM = {
  // -------------------- Form elements ---------------------
  /** Chat message form element ID */
  CHAT_FORM: "chat-form",

  /** Message input field ID */
  MESSAGE_INPUT: "msg",

  /** Input field for new group name ID */
  NEW_GROUP_NAME_INPUT: "new-group-name",
  // --------------------------------------------------------

  // -------------------- Button elements ---------------------
  /** Button to create a new group ID */
  CREATE_GROUP_BTN: "create-group-btn",

  /** Theme toggle button ID */
  THEME_TOGGLE: "theme-toggle",

  /** Notification toggle button ID */
  NOTIFICATION_TOGGLE: "notification-toggle",
  // --------------------------------------------------------

  // -------------------- Display elements --------------------
  /** Container for chat messages (class selector) */
  CHAT_MESSAGES: ".chat-messages",

  /** Display element for current room name ID */
  ROOM_NAME: "room-name",

  /** Display element for current chat type ID */
  CURRENT_CHAT_TYPE: "current-chat-type",

  /** Display element for current chat name ID */
  CURRENT_CHAT_NAME: "current-chat-name",
  // --------------------------------------------------------

  // -------------------- Icon elements --------------------
  /** Theme icon element ID */
  THEME_ICON: "theme-icon",

  /** Notification icon element ID */
  NOTIFICATION_ICON: "notification-icon",
  // --------------------------------------------------------

  // -------------------- List elements --------------------
  /** List element for users (legacy) ID */
  USER_LIST: "users",

  /** List element for users in current room ID */
  ROOM_USER_LIST: "room-users",

  /** List element for all online users ID */
  ALL_USER_LIST: "all-users",

  /** List element for available groups ID */
  GROUPS_LIST: "groups-list",

  /** List element for active chat conversations ID */
  ACTIVE_CHATS: "active-chats",
  // --------------------------------------------------------
};

// ==================== CHAT TYPES ====================
/**
 * Chat type constants
 * @enum {string}
 */
export const CHAT_TYPES = {
  /** Room chat type */
  ROOM: "room",

  /** Private/direct message chat type */
  PRIVATE: "private",

  /** Group chat type */
  GROUP: "group",
};

// ==================== THEME CONSTANTS ====================

/**
 * Theme constants
 * @enum {string}
 */
export const THEMES = {
  /** Light theme */
  LIGHT: "light",

  /** Dark theme */
  DARK: "dark",
};

/**
 * Theme icon classes (Font Awesome)
 * @enum {string}
 */
export const THEME_ICONS = {
  /** Moon icon for light mode (switch to dark) */
  MOON: "fa-moon",

  /** Sun icon for dark mode (switch to light) */
  SUN: "fa-sun",
};

// ==================== NOTIFICATION CONSTANTS ====================
/**
 * Notification icon classes (Font Awesome)
 * @enum {string}
 */
export const NOTIFICATION_ICONS = {
  /** Bell icon (notifications enabled) */
  BELL: "fa-bell",

  /** Bell slash icon (notifications disabled) */
  BELL_SLASH: "fa-bell-slash",
};

// ==================== NOTIFICATION SETTINGS ====================
/**
 * Default notification settings
 * @type {Object}
 */
export const DEFAULT_NOTIFICATION_SETTINGS = {
  /** Enable browser/desktop notifications */
  BROWSER: true,

  /** Enable notification sounds */
  SOUND: true,

  /** Master notification toggle */
  ENABLED: true,
};

/**
 * Notification sound configuration
 * @type {Object}
 */
export const SOUND_CONFIG = {
  /** Frequency in Hz */
  FREQUENCY: 800,

  /** Oscillator type */
  TYPE: "sine",

  /** Initial gain value */
  GAIN_START: 0.3,

  /** Final gain value */
  GAIN_END: 0.01,

  /** Sound duration in seconds */
  DURATION: 0.2,
};

/**
 * Browser notification configuration
 * @type {Object}
 */
export const BROWSER_NOTIFICATION_CONFIG = {
  /** Icon path for notifications */
  ICON: "/favicon.ico",

  /** Badge path for notifications */
  BADGE: "/favicon.ico",

  /** Whether notification requires user interaction to dismiss */
  REQUIRE_INTERACTION: false,

  /** Auto-close timeout in milliseconds */
  AUTO_CLOSE_TIMEOUT: 5000,

  /** Maximum message preview length */
  MAX_PREVIEW_LENGTH: 100,
};

// ==================== BADGE CONSTANTS ====================

/**
 * Unread badge configuration
 * @type {Object}
 */
export const BADGE_CONFIG = {
  /** Maximum count to display (shows "99+" above this) */
  MAX_COUNT: 99,

  /** Badge class name */
  CLASS_NAME: "unread-badge",
};

// ==================== STORAGE KEYS ====================

/**
 * LocalStorage and SessionStorage keys
 * @enum {string}
 */
export const STORAGE_KEYS = {
  /** Notification settings in localStorage */
  NOTIFICATION_SETTINGS: "notificationSettings",

  /** Pending theme in sessionStorage */
  PENDING_THEME: "pendingTheme",
};

// ==================== CSS CLASSES ====================

/**
 * CSS class names used in dynamic DOM manipulation
 * @enum {string}
 */
export const CSS_CLASSES = {
  /** Message container class */
  MESSAGE: "message",

  /** Message metadata class */
  MESSAGE_META: "meta",

  /** Message text class */
  MESSAGE_TEXT: "text",

  /** Clickable user item class */
  CLICKABLE_USER: "clickable-user",

  /** Group item class */
  GROUP_ITEM: "group-item",

  /** Active chat item class */
  ACTIVE_CHAT_ITEM: "active-chat-item",

  /** Small button class */
  BTN_SMALL: "btn-small",

  /** Unread badge class */
  UNREAD_BADGE: "unread-badge",
};

// ==================== DATA ATTRIBUTES ====================

/**
 * HTML data attribute names
 * @enum {string}
 */
export const DATA_ATTRS = {
  /** Username attribute */
  USERNAME: "data-username",

  /** Chat ID attribute */
  CHAT_ID: "data-chat-id",

  /** Theme attribute */
  THEME: "data-theme",
};

// ==================== CHAT ID PREFIXES ====================

/**
 * Prefixes for generating chat IDs
 * @enum {string}
 */
export const CHAT_ID_PREFIXES = {
  /** Room chat prefix */
  ROOM: "room_",

  /** Private message separator */
  PRIVATE: "_pm_",

  /** Group chat prefix */
  GROUP: "group_",
};

// ==================== URLS ====================

/**
 * Application URLs
 * @enum {string}
 */
export const URLS = {
  /** Login/index page */
  INDEX: "index.html",

  /** Chat page */
  CHAT: "chat.html",
};

// ==================== BOT CONFIGURATION ====================

/**
 * Bot/System message configuration
 * @type {Object}
 */
export const BOT_CONFIG = {
  /** System bot username */
  BOT_NAME: "System",
};

// ==================== VALIDATION CONSTANTS ====================

/**
 * Input validation constants
 * @type {Object}
 */
export const VALIDATION = {
  /** Maximum username length */
  MAX_USERNAME_LENGTH: 20,

  /** Minimum username length */
  MIN_USERNAME_LENGTH: 1,
};
