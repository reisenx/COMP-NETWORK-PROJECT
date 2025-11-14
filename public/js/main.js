/**
 * @fileoverview Real-time chat application client-side entry point
 * Initializes and coordinates all application modules
 *
 * This is the refactored main entry point that imports modular components
 * instead of containing all logic in a single file.
 *
 * Features:
 * - Room chat
 * - Private messaging (R7)
 * - Group chat (R8-R11)
 * - Theme management
 * - Notification system
 */

// ==================== CORE IMPORTS ====================
import { socket } from "./core/socket.js";
import { getUsername, getRoom } from "./core/state.js";

// ==================== HANDLER IMPORTS ====================
import {
  initializeSocketHandlers,
  joinRoom,
} from "./handlers/socketEventHandlers.js";
import { initializeUIHandlers } from "./handlers/uiEventHandlers.js";

// ==================== CHAT MODULE IMPORTS ====================
import { switchToRoomChat } from "./modules/chat/roomChat.js";

// ==================== NOTIFICATION IMPORTS ====================
import {
  loadNotificationSettings,
  saveNotificationSettings,
} from "./modules/notifications/notificationManager.js";
import { requestNotificationPermission } from "./modules/notifications/browserNotifaction.js";

// ==================== THEME IMPORTS ====================
import {
  initializeTheme,
  setupThemeToggle,
} from "./modules/theme/themeManager.js";

// ==================== UI MODULE IMPORTS ====================
import { updateChatContext } from "./modules/ui/chatContext.js";

/**
 * Initialize the application
 * Sets up all modules, event handlers, and initial state
 */
function initializeApp() {
  console.log("[APP] Initializing chat application...");

  // 1. Initialize notification system
  loadNotificationSettings();
  requestNotificationPermission();
  console.log("[APP] Notification system initialized");

  // 2. Initialize theme system
  initializeTheme();
  setupThemeToggle();
  console.log("[APP] Theme system initialized");

  // 3. Initialize UI event handlers
  initializeUIHandlers();
  console.log("[APP] UI event handlers initialized");

  // 4. Initialize socket event handlers
  initializeSocketHandlers();
  console.log("[APP] Socket event handlers initialized");

  // 5. Join room with credentials
  joinRoom();
  console.log(`[APP] Joining room as ${getUsername()}`);

  // 6. Initialize chat context
  updateChatContext();
  switchToRoomChat();
  console.log("[APP] Chat context initialized");

  console.log("[APP] Application initialized successfully");
}

// ==================== APPLICATION STARTUP ====================

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// ==================== CLEANUP ====================

/**
 * Clean up on page unload
 */
window.addEventListener("beforeunload", () => {
  saveNotificationSettings();
  console.log("[APP] Cleaning up...");
});
