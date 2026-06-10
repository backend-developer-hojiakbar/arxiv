/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function pickMimeType(): string {
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }
  return "";
}

export async function recordAudio(
  durationMs: number,
  existingStream?: MediaStream
): Promise<{ blob: Blob; stream: MediaStream }> {
  const stream = existingStream || (await navigator.mediaDevices.getUserMedia({ audio: true }));
  const mimeType = pickMimeType();
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => reject(new Error("Yozib olish xatosi"));
    recorder.onstop = () => {
      resolve({
        blob: new Blob(chunks, { type: "audio/webm" }),
        stream,
      });
    };

    recorder.start(250);
    window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, durationMs);
  });
}

export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

export async function playAudioBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Ovoz ijro etish xatosi"));
    };
    void audio.play().catch(reject);
  });
}
