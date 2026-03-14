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
  /**
   * Manually send an AI-generated WhatsApp message to a single account.
   * Backend will look up the primary_contact_phone and generate the text.
   */
  sendToAccount: async (accountId: string, payload: SendToAccountPayload): Promise<WhatsAppSendResponse> => {
    const body: Record<string, unknown> = {
      account_id: accountId,
    };
    if (payload.purpose && payload.purpose.trim()) {
      body.purpose = payload.purpose.trim();
    }
    if (payload.details && payload.details.trim()) {
      body.details = payload.details.trim();
    }

    return fetchApi("/whatsapp/send-to-account", {
      method: "POST",
      body: JSON.stringify(body),
    }) as Promise<WhatsAppSendResponse>;
  },
};

