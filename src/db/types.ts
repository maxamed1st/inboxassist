export interface EmailContent {
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string;
    contentId?: string;
    contentType: string;
    contentDisposition: string;
    size: number;
  }>;
  summary?: string;
}

export interface ActionPayload {
  userMessage?: string;
  [key: string]: any;
}