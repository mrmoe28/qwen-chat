// Guest invoice tracking service for anonymous users

interface GuestSession {
  id: string;
  invoicesCreated: number;
  invoiceLimit: number;
  createdAt: string;
  invoices: GuestInvoice[];
}

interface GuestInvoice {
  id: string;
  customerName: string;
  amount: number;
  description: string;
  createdAt: string;
  status: 'draft' | 'sent' | 'paid';
}

const GUEST_SESSION_KEY = 'ledgerflow_guest_session';
const GUEST_INVOICE_LIMIT = 3;

export class GuestService {
  private static getSession(): GuestSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(GUEST_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private static saveSession(session: GuestSession): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }
  }

  static initializeSession(): GuestSession {
    let session = this.getSession();
    
    if (!session) {
      session = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        invoicesCreated: 0,
        invoiceLimit: GUEST_INVOICE_LIMIT,
        createdAt: new Date().toISOString(),
        invoices: [],
      };
      this.saveSession(session);
    }
    
    return session;
  }

  static getInvoicesRemaining(): number {
    const session = this.getSession();
    if (!session) return GUEST_INVOICE_LIMIT;
    
    return Math.max(0, session.invoiceLimit - session.invoicesCreated);
  }

  static canCreateInvoice(): boolean {
    return this.getInvoicesRemaining() > 0;
  }

  static createInvoice(invoice: Omit<GuestInvoice, 'id' | 'createdAt'>): GuestInvoice | null {
    if (!this.canCreateInvoice()) return null;
    
    const session = this.initializeSession();
    
    const newInvoice: GuestInvoice = {
      ...invoice,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString(),
    };
    
    session.invoices.push(newInvoice);
    session.invoicesCreated += 1;
    
    this.saveSession(session);
    return newInvoice;
  }

  static getInvoices(): GuestInvoice[] {
    const session = this.getSession();
    return session?.invoices || [];
  }

  static getInvoice(id: string): GuestInvoice | null {
    const invoices = this.getInvoices();
    return invoices.find(inv => inv.id === id) || null;
  }

  static updateInvoice(id: string, updates: Partial<GuestInvoice>): GuestInvoice | null {
    const session = this.getSession();
    if (!session) return null;
    
    const invoiceIndex = session.invoices.findIndex(inv => inv.id === id);
    if (invoiceIndex === -1) return null;
    
    session.invoices[invoiceIndex] = { ...session.invoices[invoiceIndex], ...updates };
    this.saveSession(session);
    
    return session.invoices[invoiceIndex];
  }

  static clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(GUEST_SESSION_KEY);
  }

  static transferToUser(): GuestInvoice[] {
    // This would be called during sign-up to transfer guest invoices to the new user
    const invoices = this.getInvoices();
    this.clearSession();
    return invoices;
  }

  static getSessionStats() {
    const session = this.getSession();
    if (!session) {
      return {
        invoicesCreated: 0,
        invoicesRemaining: GUEST_INVOICE_LIMIT,
        invoiceLimit: GUEST_INVOICE_LIMIT,
        canCreateMore: true,
        shouldPromptSignup: false,
      };
    }
    
    const remaining = Math.max(0, session.invoiceLimit - session.invoicesCreated);
    
    return {
      invoicesCreated: session.invoicesCreated,
      invoicesRemaining: remaining,
      invoiceLimit: session.invoiceLimit,
      canCreateMore: remaining > 0,
      shouldPromptSignup: remaining === 0,
    };
  }
}