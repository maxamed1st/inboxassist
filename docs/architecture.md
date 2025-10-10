# InboxAssist System Architecture

InboxAssist is an **event-driven system** for managing user emails with AI assistance, while ensuring users retain full control. The system is **modular, decoupled, and database-centric**, with the database acting as the **source of truth** for all operations.

---

## Components

### Email
Handles email account management, sending, receiving, moving, and threading.

**Responsibilities:**
- Connect and disconnect user email accounts
- Poll and fetch new emails
- Send emails
- Move emails between folders
- Store emails in the database with status tracking: `"received" | "draft" | "sent"`

**Database tables:** `emails`, `accounts`

**Notes**
- Email content is stored as JSONB, including main content and summaries for flexibility and future features
- Recipients and references (`to`, `cc`, `bcc`, `references`) are JSONB arrays to support multiple recipients and threading
- Threading can be maintained via `replyToId` in messages and `references` fields if necessary

---

### NLP
Handles natural language tasks such as intent classification, email summarization, and reply generation.

**Responsibilities:**
- Classify user intents from messages (`compose`, `edit`, `send`, etc.)
- Summarize incoming emails
- Compose or edit email replies
- Handle generic assistant messages
- Create and track actions in the system

**Database tables:** `actions`, `messages`, `emails`

---

### Connection
Handles all user interfaces. Currently, the MVP uses a **Telegram bot**, but the system is designed to support multiple platforms.

**Responsibilities:**
- Receive user messages and emit `"message:user"` events
- Send assistant responses
- Connect email account
- Purchase credit
- Show credit balance
- Prune database
- Notify users of action results

**Database tables:** `connections`, `users`, `messages`

**Notes**
- Connection sends link to user for email authentication and credit purchase
- User decides if they want to prune chats, emails or both

---

### Billing
Tracks usage, updates user credits, and processes payments.

**Responsibilities:**
- Process payments via Stripe (or other providers)
- Update `users.credits` atomically
- Track usage across events and actions
- Consume usage data from completed events

**Database tables:** `payments`, `users`

**Notes**
- Usage is tracked per event to calculate accurate credit consumption
- Payments are recorded in the `payments` table and linked to user accounts
- Credit updates are atomic to prevent inconsistencies

---

## Database Schema Overview

All components share access to a **PostgreSQL database** via `drizzle-orm`. Key tables:

- **users**: id, email, name, credits, timestamps
- **accounts**: user email accounts and tokens
- **connections**: user platform connections
- **emails**: stored emails with threading and JSONB content
- **actions**: user/system actions and nested workflows
- **messages**: chat messages linked to emails
- **payments**: credit payments and statuses

**Notes**
- The database serves as the **source of truth**. Every action, message, and email must be persisted before events are emitted
- All email and chat content encrypted at rest and in transit
- Columns with JSONB are typed on the application level

---

## Event Flow

InboxAssist is an **event-driven system** using thin events. Each event carries minimal data; additional details are fetched from the database.
Event ids map directly to relevant table id.

#### User Message
1. User sends a message → `"message:user"` event is emitted
2. **NLP / Intent Classifier** consumes the event → creates an entry in `actions` table → emits `"action:ACTION_TYPE"`
3. Email/NLP modules handle the action (compose, edit, send, move) → emit `"email:*"` or `"action:*"` events
4. **Billing** and **Connection** consume completed events:
   - Billing: updates credits and usage
   - Connection: notifies the user of results

#### New Email
1. New email is fetched → `"email:new"` event is emitted
2. **NLP / Summeriser** consumes the event → summerises the email and emits → `"email:summerised"`
3. **Billing** and **Connection** consume completed events:
   - Billing: updates credits and usage
   - Connection: notifies the user of results

---

### Event Channels
Channels are set up in the format `"component/table:action"` 
They can be found in events/types.
Events that are not workflows don't need/have payload.

---
