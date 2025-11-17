import { publish } from "@/events/broker";
import { imapClient } from "@/email/clients";
import { getEmailById } from "@/db/queries/emails";
import { getAccountById } from "@/db/queries/accounts";
import { decrypt } from "@/utils/encryption";

export async function moveEmail({ emailId, folder, threadId }: { emailId: string, folder: string, threadId?: string }){
  const email = await getEmailById(emailId);
  if (!email) {
    throw new Error(`Failed to get email from db: ${emailId}`);
  }

  const account = await getAccountById(email.accountId);

  if (!account) {
    throw new Error(`Failed to get account from db: ${email.accountId}`);
  }

  const client = imapClient({
    host: "imap.gmail.com",
    accessToken: decrypt(account.accessToken),
    emailAddress: decrypt(account.providerAccountId),
  });
  await client.connect();

  const lock = await client.getMailboxLock('INBOX');
  try {
    // find correct path
    const boxes = await client.list()
    let targetBox = boxes.find(b => b.name.trim().toLowerCase() == folder.trim().toLowerCase()) || boxes.find(b => b.name.trim().toLowerCase().includes(folder.trim().toLowerCase())) 

    if(!targetBox) {
      await publish("message:assistant", {
        id: email.userId,
        content: `Failed to move email to ${folder}, Folder does not exist. \n\nHere are the existing folders:\n${boxes.map(item => item.name).join(', ')}`,
        emailId: email.id,
        threadId
      });
      return;
    }

    const targetPath = targetBox.path;
    // get the correct uid
    const messageId = email.externalEmailId;
    const uids = await client.search({ header: {"Message-ID": messageId }});
    if(!uids || !uids[0]) throw new Error(`Failed to find email to move`);

    const moved = await client.messageMove(uids[0], targetPath);

    if(!moved) {
      throw new Error(`Failed to move email`);
    }
    else {
      await publish("message:assistant", {
        id: email.userId,
        content: `Email has been moved to folder: ${targetBox.name}`,
        emailId: email.id,
        threadId
      });
    }
  } catch (err) {
    throw new Error(`Failed to move email: ${err}`)
  } finally {
    lock.release();
    await client.logout();
  }
}
