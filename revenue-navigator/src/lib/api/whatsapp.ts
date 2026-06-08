import { fetchApi } from "./client";

interface SendToAccountPayload {
  purpose?: string;
  details?: string;
}

export interface WhatsAppSendResponse {
  status: string;
  sid?: string;
  to?: string;
  preview?: string;
}

export const whatsappApi = {
  /** Generate a preview without sending. */
  generatePreview: async (accountId: string, topic: string): Promise<{ preview: string; account_name: string }> => {
    return fetchApi("/whatsapp/generate-preview", {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, topic }),
    }) as Promise<{ preview: string; account_name: string }>;
  },

  /** Send an AI-generated WhatsApp to a single account (with optional custom text). */
  sendToAccount: async (accountId: string, payload: SendToAccountPayload & { custom_text?: string }): Promise<WhatsAppSendResponse> => {
    const body: Record<string, unknown> = { account_id: accountId };
    if (payload.purpose?.trim()) body.purpose = payload.purpose.trim();
    if (payload.details?.trim()) body.details = payload.details.trim();
    if (payload.custom_text?.trim()) body.custom_text = payload.custom_text.trim();
    return fetchApi("/whatsapp/send-to-account", {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<WhatsAppSendResponse>;
  },

  /** Send AI-generated WhatsApp to ALL eligible accounts. */
  triggerAll: async (topic?: string): Promise<{ status: string; sent: number; failed: number }> => {
    const body: Record<string, unknown> = {};
    if (topic?.trim()) body.purpose = topic.trim();
    return fetchApi("/whatsapp/trigger-all", {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<{ status: string; sent: number; failed: number }>;
  },

  getConversations: async (skip = 0, limit = 100) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    return fetchApi(`/whatsapp/conversations?${params}`);
  },
};
