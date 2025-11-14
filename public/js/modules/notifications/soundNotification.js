/**
 * @fileoverview Sound notification module
 * Handles notification sound playback
 */

import { getNotificationSettings } from "./notificationManager.js";

/**
 * Play a notification sound using Web Audio API
 * Creates a simple beep sound (800Hz sine wave)
 */
export function playNotificationSound() {
  const settings = getNotificationSettings();
  if (!settings.sound) return;

  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = "sine";

    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.error("[NOTIFICATIONS] Sound error:", e);
  }
}
