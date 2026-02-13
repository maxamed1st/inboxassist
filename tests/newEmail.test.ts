/* integration test for when new emails are fetched */

import { describe, it, expect, beforeAll } from "vitest";
import { getEmailById } from "@/db/queries/emails";
import { publish } from "@/events/broker";
import { seedDB } from "./utils/seed";
import { mockBot, mockNLPClient } from "./utils/mocks";
import { sleep } from "./utils/helpers";
import "@/index" // initialize application

describe("integration test for new emails", () => {
  let user: any, email: any;

  beforeAll(async () => {
    const tables = await seedDB();
    user = tables.user;
    email = tables.email;
    mockNLPClient();
    mockBot();

    // wait for event listners
    await sleep(1000);
  })

  it("creates summary", async () => {
    await publish("email:new", { userId: user.id, emailId: email.id });
    await sleep(1000);

    const emailWithSummary = await getEmailById(email.id);
    expect(emailWithSummary?.content.summary).toBe("mocked response");
  })
})
