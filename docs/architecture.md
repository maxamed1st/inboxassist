# Overview
This is an **event-driven system** for managing emails for users with AI while the user retains full control.

# Components
The system is fully decoupled into a few components, except for the database which all components access. The database serves as the **source of truth**.

## Email
Handles email account connection/disconnection, receiving, sending, and moving emails.

## NLP
Handles classifying user intent, summarising emails, composing replies, editing content, and responding to generic user messages.

## Connection
Handles user interfaces. For the MVP, this is a Telegram bot. The connection model is generic and extensibl to other platforms.

## Billing
Handles payments, updates user credits, and tracks usage.

# Flow
1. User sends a message → `"message:user"` event is emitted.
2. Intent classifier receives the event → creates an entry in the `actions` table and → emits `"action:ACTION_TYPE"`.
3. Email/NLP modules handle the action (e.g., compose, edit, send, move).
4. Once handled, `"email:*"` or `"action:*"` events are emitted.
5. Billing and Connection consumes the event.
6. Billing updates credits while Connection notifies user.

# Important Considerations
1. **Database as source of truth**: all actions must be persisted before emitting events.  
2. **Thin events**: events contain minimal information. Additional details can be queried from the database.  
3. **Event IDs** correspond to the record in the relevant table:  
   - `"message:user"` / `"message:assistant"` → `messages.id`  
   - `"action:*"` → `actions.id`  
   - `"email:*"` → `emails.id`  
4. **Email table**: stores received, drafted, composed, and sent emails. Status is `"received" | "draft" | "sent"`.  
5. **Content field**: stores the main email content. Summaries are included in `content` (JSONB), supporting future expansion.  
6. **Recipients & references**: `to`, `cc`, `bcc`, and `references` are JSONB arrays for flexibility.  
7. **Reply mapping**: `replyToId` in messages links user messages to emails; `references` in messages and emails tracks threading.  
8. **Actions table**: generic enough for workflows and nested actions (`parentAction`). Tracks user/system role, status, and linked email.  
9. **Payments**: stored in `payments` table, credits updated atomically in `users.credits`.  
10. **Security**: Email and chat content must be encrypted at rest and in transit
11. **billing**: Usage duration is tracked across events and Billing consumes once the system is done and updates credits
