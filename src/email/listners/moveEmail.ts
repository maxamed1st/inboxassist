import { publish } from "@/events/broker";
import { imapClient } from "@/email/clients";
import { getEmailById, updateEmailById } from "@/db/queries/emails";
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
    host: decrypt(account.providerIMAP),
    accessToken: decrypt(account.accessToken),
    emailAddress: decrypt(account.providerAccountId),
  });
  await client.connect();

  const lock = await client.getMailboxLock('INBOX');
  try {
    // find correct path
    const boxes = await client.list()
    const targetBox = boxes.find(b => b.name.trim().toLowerCase() == folder.trim().toLowerCase()) || boxes.find(b => b.name.trim().toLowerCase().includes(folder.trim().toLowerCase())) 

    if(!targetBox) {
      await publish("message:assistant", {
        userId: email.userId,
        content: `Failed to move email to ${folder}, Folder does not exist. \n\nHere are the existing folders:\n${boxes.map(item => item.name).join(', ')}`,
        emailId: email.id,
        threadId
      });
      return;
    }

    const targetPath = targetBox.path;
    const moved = await client.messageMove(email.imapUid, targetPath);

    if(!moved) {
      await publish("message:assistant", {
        userId: email.userId,
        content: `Could not move the email to ${targetBox.name}.`,
        emailId,
        threadId
      })
      console.error(`Failed to move email`);
      return;
    }

    await publish("message:assistant", {
      userId: email.userId,
      content: `Email has been moved to folder: ${targetBox.name}`,
      emailId: email.id,
      threadId
    });

    // Update local uid
    const uidMap = moved.uidMap;
    if(!uidMap || !uidMap.has(email.imapUid)) {
      console.error("Failed to get new imap uid after move command");
      return;
    }

    const updated = await updateEmailById(email.id, { imapUid: uidMap.get(email.imapUid) });
    if(!updated) {
      console.error("Failed to insert the new imap uid");
    }
  } catch (err) {
    throw new Error(`Failed to move email: ${err}`)
  } finally {
    lock.release();
    await client.logout();
  }
}
