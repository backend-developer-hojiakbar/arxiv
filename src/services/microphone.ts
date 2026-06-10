/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
