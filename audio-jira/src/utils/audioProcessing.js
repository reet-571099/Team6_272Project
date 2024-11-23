export const createAudioBlob = (chunks) => {
  return new Blob(chunks, { type: "audio/webm" });
};

export const formatAudioDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
