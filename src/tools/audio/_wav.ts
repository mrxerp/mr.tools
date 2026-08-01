/** Shared pure-TS WAV (16-bit PCM) encoder + header parser. No browser APIs. */

export interface WavInfo {
  sampleRate: number;
  numChannels: number;
  bytesPerSample: number;
  dataLength: number;
}

export function encodeWav(
  interleaved: Float32Array,
  sampleRate: number,
  numChannels: number,
): ArrayBuffer {
  const numFrames = Math.floor(interleaved.length / numChannels);
  const bytesPerSample = 2;
  const dataBytes = numFrames * numChannels * bytesPerSample;
  const buf = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buf);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeStr(36, "data");
  view.setUint32(40, dataBytes, true);

  let o = 44;
  for (let i = 0; i < interleaved.length; i++) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return buf;
}

export function wavInfo(buf: ArrayBuffer): WavInfo {
  const view = new DataView(buf);
  return {
    sampleRate: view.getUint32(24, true),
    numChannels: view.getUint16(22, true),
    bytesPerSample: view.getUint16(34, true) / 8,
    dataLength: view.getUint32(40, true),
  };
}
