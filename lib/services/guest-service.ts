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
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  description: string;
  createdAt: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid';
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
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

  static createInvoice(invoiceData: {
    customerName: string;
    customerEmail?: string;
    description: string;
    amount: number;
  }): GuestInvoice | null {
    if (!this.canCreateInvoice()) return null;
    
    const session = this.initializeSession();
    const invoiceNumber = this.generateInvoiceNumber(session.invoicesCreated + 1);
    const createdAt = new Date();
    const dueDate = new Date(createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
    
    const newInvoice: GuestInvoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      invoiceNumber,
      customerName: invoiceData.customerName,
      customerEmail: invoiceData.customerEmail,
      amount: invoiceData.amount,
      description: invoiceData.description,
      createdAt: createdAt.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'draft',
      items: [
        {
          description: invoiceData.description,
          quantity: 1,
          rate: invoiceData.amount,
          amount: invoiceData.amount,
        }
      ],
    };
    
    session.invoices.push(newInvoice);
    session.invoicesCreated += 1;
    
    this.saveSession(session);
    return newInvoice;
  }

  private static generateInvoiceNumber(count: number): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `INV-${year}${month}-${String(count).padStart(3, '0')}`;
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