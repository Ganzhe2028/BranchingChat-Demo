const STREAM_DELAY_MS = 30;

export const streamMockResponse = async (
  text: string,
  onToken: (char: string) => void,
): Promise<void> => {
  const chars = text.split("");
  for (let i = 0; i < chars.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, STREAM_DELAY_MS));
    onToken(chars[i]);
  }
};
