import { vi } from "vitest";
import { nlpClient } from "@/nlp/clients";
import { bot } from "@/socials/telegram/clients";

export function mockNLPClient() {
  const nlpMock = vi.fn().mockResolvedValue({
    choices: [{ message: { content: "mocked response" } }]
  });

  vi.spyOn(nlpClient.chat.completions, "create").mockImplementation(nlpMock);
}

export function mockBot() {
  const now = new Date();

  const sendMessageMock = vi.fn().mockResolvedValue({
    message_id: 22,
    chat: { id: 2 },
    text: "mocked Message",
    date: now,
  });

  vi.spyOn(bot.telegram, "sendMessage").mockImplementation(sendMessageMock);
  vi.spyOn(bot.telegram, "getMe")
}
