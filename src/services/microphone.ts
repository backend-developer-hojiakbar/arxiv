/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let audioUnlocked = false;

export async function unlockAudioPlayback(): Promise<void> {
  if (audioUnlocked) return;
  const silent = new Audio(
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
  );
  silent.volume = 0.01;
  try {
    await silent.play();
    audioUnlocked = true;
  } catch {
    /* user gesture kerak */
  }
}

export async function ensureMicrophoneAccess(): Promise<void> {
  if (!window.isSecureContext) {
    throw new Error("Mikrofon uchun HTTPS yoki localhost kerak");
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Brauzer mikrofondan foydalana olmaydi");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}
