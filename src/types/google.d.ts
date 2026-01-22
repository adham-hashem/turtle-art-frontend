// types/google.d.ts
interface GoogleId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string; select_by: string }) => void;
    context?: string;
    ux_mode?: 'popup' | 'redirect';
    prompt?: string;
    locale?: string;
  }) => void;
  renderButton: (
    element: HTMLElement | null,
    options: {
      theme: string;
      size: string;
      text: string;
      width: string;
      locale?: string;
    }
  ) => void;
  prompt: () => void;
}

interface GoogleAccounts {
  id: GoogleId;
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}