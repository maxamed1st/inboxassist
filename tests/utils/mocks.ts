import { vi } from "vitest";
import { nlpClient } from "@/nlp/clients";

export function mockNLPClient() {
  const nlpMock = vi.fn().mockResolvedValue({
    choices: [{ message: { content: "mocked response" } }]
  });

  vi.spyOn(nlpClient.chat.completions, "create").mockImplementation(nlpMock);
}
