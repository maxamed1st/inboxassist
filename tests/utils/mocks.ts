import { vi } from "vitest";
import { nlpClient } from "@/nlp/clients";

export function mockNLPClient() {
  const nlpMock = vi.fn().mockResolvedValue({
    choices: [{ message: { content: "mocked response" } }]
  });

  vi.spyOn(nlpClient.chat.completions, "create").mockImplementation(nlpMock);
}

export function mockBot() {
  vi.mock("telegraf", () => ({
    Telegraf: function() {
      return {
        launch: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        on: vi.fn().mockReturnThis(),
        command: vi.fn().mockReturnThis(),
        start: vi.fn().mockReturnThis(),
        telegram: {
          sendMessage: vi.fn().mockResolvedValue({
            message_id: 22,
            chat: { id: 2 },
            text: "mocked Message",
            date: new Date(),
          }),
          getMe: vi.fn()
        },
      }
    }
  }))
}
