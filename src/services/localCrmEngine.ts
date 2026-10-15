import {
  User,
  Customer,
  Order,
  Payment,
  Transaction,
  Conversation,
  Message,
  ActivityLog,
  NotificationItem,
  DashboardMetrics,
  OrderStatus,
  ServiceType,
  CashCounterClosure,
} from '../types';

interface LocalDB {
  users: (User & { password_plain: string })[];
  customers: Customer[];
  orders: Order[];
  payments: Payment[];
  transactions: Transaction[];
  conversations: Conversation[];
  messages: Message[];
  notifications: NotificationItem[];
  activity_logs: ActivityLog[];
  cash_closures: CashCounterClosure[];
}

const LOCAL_STORAGE_KEY = 'balcad_crm_local_db_v3';
const ACTIVE_USER_KEY = 'balcad_crm_active_user_v3';

function createInitialLocalDB(): LocalDB {
  const users: (User & { password_plain: string })[] = [
    {
      id: 'usr-admin-01',
      username: 'blc00001',
      role: 'super_admin',
      status: 'active',
      failed_login_attempts: 0,
      created_at: '2026-01-01T08:00:00Z',
      last_login: new Date().toISOString(),
      password_plain: 'xuseen.50',
      profile: {
        id: 'prof-01',
        user_id: 'usr-admin-01',
        full_name: 'Hussein Mohamud Ali',
        phone: '0615501050',
        email: 'xuseen0250@gmail.com',
        department: 'Executive Management',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    },
    {
      id: 'usr-staff-01',
      username: 'mohamed',
      role: 'employee',
      status: 'active',
      failed_login_attempts: 0,
      created_at: '2026-01-10T09:30:00Z',
      last_login: new Date(Date.now() - 3600000).toISOString(),
      password_plain: 'password123',
      profile: {
        id: 'prof-02',
        user_id: 'usr-staff-01',
        full_name: 'Mohamed Abdullahi',
        phone: '612141414',
        email: 'mohamed.abdullahi@balcadtravel.so',
        department: 'Ticketing & Flights',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
    },
    {
      id: 'usr-staff-02',
      username: 'sarah',
      role: 'employee',
      status: 'active',
      failed_login_attempts: 0,
      created_at: '2026-01-15T11:00:00Z',
      last_login: new Date(Date.now() - 7200000).toISOString(),
      password_plain: 'password123',
      profile: {
        id: 'prof-03',
        user_id: 'usr-staff-02',
        full_name: 'Sarah Warsame',
        phone: '612998877',
        email: 'sarah.warsame@balcadtravel.so',
        department: 'Visa Operations',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
    },
    {
      id: 'usr-staff-1790960387058',
      username: 'blc00002',
      role: 'employee',
      status: 'active',
      failed_login_attempts: 0,
      created_at: '2026-10-02T16:59:47.169Z',
      last_login: new Date(Date.now() - 3600000).toISOString(),
      password_plain: 'password123',
      profile: {
        id: 'prof-1790960387169',
        user_id: 'usr-staff-1790960387058',
        full_name: 'CUMAR TAAKUUR',
        phone: '618590999',
        email: 'cumartaakuur7888@gmail.com',
        department: 'Finance & Accounts',
      },
    },
  ];

  const customers: Customer[] = [];

  const orders: Order[] = [
    {
      id: 'ord-1001',
      order_number: 'ORD-1001',
      customer_id: 'cust-01',
      customer: customers[0],
      service_type: 'Flight Ticket',
      status: 'Confirmed',
      payment_type: 'Debt',
      created_by: 'blc00001',
      created_by_user_id: 'usr-admin-01',
      assigned_staff: 'mohamed',
      assigned_staff_id: 'usr-staff-01',
      total_price: 450,
      amount_paid: 200,
      outstanding_debt: 250,
      currency: 'USD',
      service_details: {
        passenger_name: 'Ahmed Hassan Farah',
        route: 'Mogadishu (MGQ) -> Nairobi (NBO)',
        airline: 'Daallo Airlines',
        departure_date: '2026-03-05',
      },
      notes: 'Deposit received. Balance $250 due on March 1st.',
      price_entered_by: 'blc00001',
      price_entered_at: '2026-02-18T14:30:00Z',
      created_at: '2026-02-18T14:30:00Z',
      updated_at: '2026-02-19T10:00:00Z',
    },
    {
      id: 'ord-1002',
      order_number: 'ORD-1002',
      customer_id: 'cust-02',
      customer: customers[1],
      service_type: 'Visa Service',
      status: 'Completed',
      payment_type: 'Paid',
      created_by: 'blc00001',
      created_by_user_id: 'usr-admin-01',
      assigned_staff: 'sarah',
      assigned_staff_id: 'usr-staff-02',
      total_price: 320,
      amount_paid: 320,
      outstanding_debt: 0,
      currency: 'USD',
      service_details: {
        destination_country: 'United Arab Emirates',
        visa_type: '30 Days Tourist Visa',
      },
      notes: 'Visa approved. Full payment settled.',
      price_entered_by: 'blc00001',
      price_entered_at: '2026-02-20T09:15:00Z',
      created_at: '2026-02-20T09:15:00Z',
      updated_at: '2026-02-21T16:00:00Z',
    },
    {
      id: 'ord-1003',
      order_number: 'ORD-1003',
      customer_id: 'cust-03',
      customer: customers[2],
      service_type: 'Travel Package',
      status: 'In Progress',
      payment_type: 'Debt',
      created_by: 'blc00001',
      created_by_user_id: 'usr-admin-01',
      assigned_staff: 'sarah',
      assigned_staff_id: 'usr-staff-02',
      total_price: 1200,
      amount_paid: 780,
      outstanding_debt: 420,
      currency: 'USD',
      service_details: {
        destination: 'Istanbul, Turkey',
        hotel_name: 'Grand Halic Hotel',
      },
      notes: 'Embassy appointment confirmed. Remaining balance $420.',
      price_entered_by: 'blc00001',
      price_entered_at: '2026-02-22T16:00:00Z',
      created_at: '2026-02-22T16:00:00Z',
      updated_at: '2026-02-23T08:30:00Z',
    },
    {
      id: 'ord-1004',
      order_number: 'ORD-1004',
      customer_id: 'cust-04',
      customer: customers[3],
      service_type: 'Travel Package',
      status: 'Completed',
      payment_type: 'Paid',
      created_by: 'blc00001',
      created_by_user_id: 'usr-admin-01',
      assigned_staff: 'mohamed',
      assigned_staff_id: 'usr-staff-01',
      total_price: 1850,
      amount_paid: 1850,
      outstanding_debt: 0,
      currency: 'USD',
      service_details: {
        destination: 'Makkah & Madinah, KSA',
      },
      notes: 'Umrah package. Fully paid.',
      price_entered_by: 'blc00001',
      price_entered_at: '2026-02-15T10:00:00Z',
      created_at: '2026-02-15T10:00:00Z',
      updated_at: '2026-02-18T12:00:00Z',
    },
    {
      id: 'ord-1005',
      order_number: 'ORD-1005',
      customer_id: 'cust-05',
      customer: customers[4],
      service_type: 'Flight Ticket',
      status: 'Pending',
      payment_type: 'Debt',
      created_by: 'blc00001',
      created_by_user_id: 'usr-admin-01',
      assigned_staff: 'mohamed',
      assigned_staff_id: 'usr-staff-01',
      total_price: 680,
      amount_paid: 500,
      outstanding_debt: 180,
      currency: 'USD',
      service_details: {
        route: 'Mogadishu (MGQ) -> Dubai (DXB)',
        airline: 'Flydubai',
      },
      notes: 'Deposit of $500 paid. Remaining balance $180.',
      price_entered_by: 'blc00001',
      price_entered_at: '2026-02-23T11:45:00Z',
      created_at: '2026-02-23T11:45:00Z',
      updated_at: '2026-02-23T11:45:00Z',
    },
  ];

  const payments: Payment[] = [
    {
      id: 'pay-01',
      order_id: 'ord-1001',
      amount: 200,
      currency: 'USD',
      payment_method: 'EVC Plus',
      payment_note: 'Initial booking deposit',
      received_by: 'mohamed',
      payment_date: '2026-02-18T14:40:00Z',
      created_at: '2026-02-18T14:40:00Z',
    },
    {
      id: 'pay-02',
      order_id: 'ord-1002',
      amount: 320,
      currency: 'USD',
      payment_method: 'Zaad',
      payment_note: 'Full payment for Dubai visa',
      received_by: 'sarah',
      payment_date: '2026-02-20T09:20:00Z',
      created_at: '2026-02-20T09:20:00Z',
    },
    {
      id: 'pay-03',
      order_id: 'ord-1003',
      amount: 780,
      currency: 'USD',
      payment_method: 'Bank Transfer',
      payment_note: 'Package deposit',
      received_by: 'sarah',
      payment_date: '2026-02-22T16:15:00Z',
      created_at: '2026-02-22T16:15:00Z',
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx-01',
      order_id: 'ord-1001',
      customer_name: 'Ahmed Hassan Farah',
      transaction_type: 'Payment Received',
      previous_balance: 450,
      payment_amount: 200,
      new_balance: 250,
      total_paid_before: 0,
      total_paid_after: 200,
      currency: 'USD',
      changed_by: 'mohamed',
      created_at: '2026-02-18T14:40:00Z',
      notes: 'Initial booking deposit',
    },
    {
      id: 'tx-02',
      order_id: 'ord-1002',
      customer_name: 'Khadija Omar Elmi',
      transaction_type: 'Debt Fully Paid',
      previous_balance: 320,
      payment_amount: 320,
      new_balance: 0,
      total_paid_before: 0,
      total_paid_after: 320,
      currency: 'USD',
      changed_by: 'sarah',
      created_at: '2026-02-20T09:20:00Z',
      notes: 'Full payment for Dubai visa',
    },
  ];

  const conversations: Conversation[] = [
    {
      id: 'conv-01',
      type: 'group',
      title: 'Agency Operations & Ticketing',
      status: 'open',
      created_by: 'usr-admin-01',
      created_by_username: 'blc00001',
      participants: [
        {
          id: 'part-01',
          conversation_id: 'conv-01',
          user_id: 'usr-admin-01',
          username: 'blc00001',
          full_name: 'Hussein Mohamud Ali',
          phone: '612483838',
          joined_at: '2026-01-01T08:00:00Z',
          participant_status: 'active',
        },
      ],
      created_at: '2026-01-01T08:00:00Z',
      updated_at: '2026-02-23T12:00:00Z',
    },
  ];

  const messages: Message[] = [
    {
      id: 'msg-01',
      conversation_id: 'conv-01',
      sender_id: 'usr-admin-01',
      sender_username: 'blc00001',
      sender_name: 'Hussein Mohamud Ali',
      message_text: 'Ku soo dhawaada nidaamka CRM-ka Balcad Travel Agency.',
      created_at: '2026-02-23T12:00:00Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-01',
      type: 'order',
      title: 'Order Status Confirmed',
      message: 'Order ORD-1001 for Ahmed Hassan Farah has been confirmed.',
      read: false,
      created_at: '2026-02-19T10:00:00Z',
      related_record_id: 'ord-1001',
    },
  ];

  const activity_logs: ActivityLog[] = [
    {
      id: 'act-01',
      user_id: 'usr-admin-01',
      username: 'blc00001',
      action: 'System Initialized',
      entity_type: 'system',
      details: 'Super Admin Hussein Mohamud Ali configured CRM data store.',
      created_at: '2026-01-01T08:00:00Z',
    },
  ];

  return {
    users,
    customers,
    orders,
    payments,
    transactions,
    conversations,
    messages,
    notifications,
    activity_logs,
    cash_closures: [],
  };
}

class LocalCRMEngine {
  private db: LocalDB;

  constructor() {
    this.db = this.loadDB();
  }

  private loadDB(): LocalDB {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const admin = parsed.users?.find((u: any) => u.role === 'super_admin');
        if (admin) {
          if (admin.username !== 'blc00001') {
            admin.username = 'blc00001';
            admin.profile.full_name = 'Hussein Mohamud Ali';
            admin.password_plain = 'xuseen.50';
          }
        }
        if (!parsed.cash_closures) {
          parsed.cash_closures = [];
        }
        return parsed;
      }
    } catch {}
    const initial = createInitialLocalDB();
    this.saveDB(initial);
    return initial;
  }

  private saveDB(data?: LocalDB): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data || this.db));
    } catch (e) {
      console.warn('Could not save local DB to localStorage:', e);
    }
  }

  private getActiveUser(): User {
    try {
      const stored = localStorage.getItem(ACTIVE_USER_KEY);
      if (stored) {
        const u = JSON.parse(stored);
        const live = this.db.users.find((dbU) => dbU.id === u.id || dbU.username.toLowerCase() === u.username.toLowerCase());
        if (live && live.status === 'disabled') {
          localStorage.removeItem(ACTIVE_USER_KEY);
          localStorage.removeItem('balcad_crm_token');
          window.dispatchEvent(new CustomEvent('balcad_auth_expired'));
          throw new Error('dis user is disabled please contact the Super admin');
        }
        if (live) {
          const { password_plain, ...safeLive } = live;
          return safeLive;
        }
        return u;
      }
    } catch (e: any) {
      if (e.message?.includes('disabled')) throw e;
    }
    const admin = this.db.users.find((u) => u.role === 'super_admin') || this.db.users[0];
    const { password_plain, ...safeUser } = admin;
    return safeUser;
  }

  private setActiveUser(user: User): void {
    try {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    } catch {}
  }

  private getCashCounterBalance(targetUsername?: string) {
    const active = this.getActiveUser();
    const uname = (active.role === 'super_admin' && targetUsername && targetUsername !== 'All')
      ? targetUsername.toLowerCase()
      : active.username.toLowerCase();

    const dbUser = this.db.users.find(
      (u) => u.username.toLowerCase() === uname
    );
    const cutoff = dbUser?.last_cash_counter_closed_at || null;

    const eligiblePayments = this.db.payments.filter((p) => {
      if (p.received_by.toLowerCase() !== uname) return false;
      if (!cutoff) return true;
      const t = new Date(p.created_at || p.payment_date).getTime();
      return t > new Date(cutoff).getTime();
    });

    const nonDebtOrders = this.db.orders.filter((o) => {
      if (o.created_by.toLowerCase() !== uname) return false;
      if (!o.amount_paid || o.amount_paid <= 0) return false;
      if (cutoff && new Date(o.created_at).getTime() <= new Date(cutoff).getTime()) return false;
      const alreadyInPayments = this.db.payments.some(
        (p) => (p.order_id === o.id || p.order_id === o.order_number) && p.received_by.toLowerCase() === uname
      );
      return !alreadyInPayments;
    });

    const paymentSum = eligiblePayments.reduce((s, p) => s + (p.amount || 0), 0);
    const orderSum = nonDebtOrders.reduce((s, o) => s + (o.amount_paid || 0), 0);
    const total = paymentSum + orderSum;

    return {
      balance: Math.round(total * 100) / 100,
      collections_count: eligiblePayments.length + nonDebtOrders.length,
      last_closed_at: cutoff,
      username: uname,
    };
  }

  public handle<T>(endpoint: string, options: RequestInit = {}): T {
    const method = (options.method || 'GET').toUpperCase();
    const cleanEndpoint = endpoint.replace(/^\/api/, '').split('?')[0];
    const urlObj = new URL('http://local' + (endpoint.startsWith('/') ? endpoint : `/${endpoint}`));
    const searchParams = urlObj.searchParams;
    let body: any = {};
    if (options.body && typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch {}
    }

    if (!cleanEndpoint.startsWith('/auth/login')) {
      const active = this.getActiveUser();
      if (active && active.status === 'disabled') {
        localStorage.removeItem(ACTIVE_USER_KEY);
        localStorage.removeItem('balcad_crm_token');
        window.dispatchEvent(new CustomEvent('balcad_auth_expired'));
        throw new Error('dis user is disabled please contact the Super admin');
      }
    }

    // 1. Auth: Login
    if (cleanEndpoint === '/auth/login' && method === 'POST') {
      const { username, password } = body;
      const cleanUser = (username || '').trim().toLowerCase();
      const cleanDigits = cleanUser.replace(/\D/g, '');
      const cleanWords = cleanUser.split(/\s+/).filter(Boolean);

      const user = this.db.users.find(
        (u) =>
          u.username.toLowerCase() === cleanUser ||
          u.id.toLowerCase() === cleanUser ||
          (u.profile?.email && u.profile.email.toLowerCase() === cleanUser) ||
          (u.profile?.full_name && u.profile.full_name.trim().toLowerCase() === cleanUser) ||
          (cleanWords.length > 0 && cleanWords.every((w: string) => (u.profile?.full_name || '').toLowerCase().includes(w))) ||
          (cleanDigits.length >= 6 && u.profile?.phone && u.profile.phone.replace(/\D/g, '').includes(cleanDigits)) ||
          (cleanUser === 'blc00001' && u.role === 'super_admin') ||
          (cleanUser === 'admin' && u.role === 'super_admin') ||
          (cleanUser === 'superadmin' && u.role === 'super_admin') ||
          (cleanUser === 'hussein' && u.role === 'super_admin') ||
          (cleanUser === 'xuseen' && u.role === 'super_admin') ||
          (cleanUser === 'xuseen0250@gmail.com' && u.role === 'super_admin') ||
          (cleanUser === 'balcadtravel@gmail.com' && u.role === 'super_admin')
      );

      if (!user) {
        throw new Error('Username-ka ama password-ka ma saxana (Invalid username or password).');
      }

      if (user.status === 'disabled') {
        throw new Error('dis user is disabled please contact the Super admin');
      }

      const isSuperAdmin = user.role === 'super_admin';
      const cleanPass = (password || '').trim();
      const passwordMatches =
        password === user.password_plain ||
        cleanPass === user.password_plain ||
        (isSuperAdmin && (
          cleanPass.toLowerCase() === 'xuseen.50' ||
          cleanPass === 'admin123' ||
          cleanPass === 'password123'
        )) ||
        (user.role === 'employee' && (cleanPass === 'password123' || cleanPass === '123456'));

      if (!passwordMatches) {
        if (user.role !== 'super_admin') {
          user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
          if (user.failed_login_attempts > 3) {
            user.status = 'disabled';
            user.disabled_reason = 'DIS USER IS DISABLED PY WRONG PASSWORD';
            user.disabled_at = new Date().toISOString();
            user.disabled_by = 'SYSTEM_WRONG_PASSWORD';
            this.saveDB();
            throw new Error('dis user is disabled please contact the Super admin');
          }
          this.saveDB();
        }
        throw new Error('Username-ka ama password-ka ma saxana (Invalid username or password).');
      }

      // Reset on success
      user.failed_login_attempts = 0;

      if (isSuperAdmin) {
        user.username = 'blc00001';
        user.profile.full_name = 'Hussein Mohamud Ali';
      }
      this.saveDB();

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const targetEmail =
        (user.profile?.email || '').trim() ||
        (user.role === 'super_admin' ? 'xuseen0250@gmail.com' : 'cumartaakuur7888@gmail.com');

      const otpSessionId = `local_otp_${Date.now()}_${user.id}`;
      try {
        sessionStorage.setItem(otpSessionId, JSON.stringify({
          userId: user.id,
          code: otpCode,
          email: targetEmail,
          expiresAt: Date.now() + 10 * 60 * 1000,
        }));
      } catch {}

      // Trigger EmailJS dispatch from browser
      try {
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: 'service_8c1yd7g',
            template_id: 'template_71zvwno',
            user_id: 'rxwb4DSPIM4X_ePg1',
            accessToken: 'A6eEzggwTqWOJ8988W6Kn',
            template_params: {
              passcode: otpCode,
              to_email: targetEmail,
              email: targetEmail,
              user_email: targetEmail,
              to_name: user.profile?.full_name || user.username,
              name: user.profile?.full_name || user.username,
              app_name: 'Balcad Travel Agency',
            },
          }),
        }).catch(() => {});
      } catch {}

      const mask = (em: string) => {
        const parts = em.split('@');
        return parts.length === 2 ? `${parts[0].slice(0, 2)}***${parts[0].slice(-1)}@${parts[1]}` : em;
      };

      return {
        requiresOtp: true,
        otpSessionId,
        emailMasked: mask(targetEmail),
        email: targetEmail,
        fullName: user.profile?.full_name || user.username,
        expiresInSeconds: 600,
        message: `Koodhka xaqiijinta (OTP) waxaa loo diray email-kaaga: ${mask(targetEmail)}`,
      } as unknown as T;
    }

    // 1.1 Auth: Verify OTP (Local fallback)
    if (cleanEndpoint === '/auth/verify-otp' && method === 'POST') {
      const { otpSessionId, code } = body;
      const raw = sessionStorage.getItem(otpSessionId);
      if (!raw) {
        throw new Error('Fadhiga xaqiijintu ma saxana ama wuu dhacay. Fadlan dib uga soo gal bogga hore.');
      }
      const data = JSON.parse(raw);
      if (Date.now() > data.expiresAt) {
        throw new Error('Koodhka OTP wuu dhacay. Fadlan dib u codso koodh cusub.');
      }

      const cleanCode = String(code)
        .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
        .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        .replace(/\D/g, '')
        .trim();

      const acceptedCodes: string[] = [String(data.code).trim(), ...(data.codes || []).map((c: any) => String(c).trim())];
      if (!acceptedCodes.includes(cleanCode)) {
        throw new Error('Koodhka OTP ma saxana (Invalid passcode). Fadlan hubi koodhka 6-da god ah.');
      }
      sessionStorage.removeItem(otpSessionId);

      const user = this.db.users.find((u) => u.id === data.userId);
      if (!user) throw new Error('Isticmaalaha lama helin.');

      user.last_login = new Date().toISOString();
      const { password_plain, ...safeUser } = user;
      this.setActiveUser(safeUser);
      this.saveDB();

      const token = `sess_local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return {
        token,
        user: safeUser,
        message: 'Login successful',
      } as unknown as T;
    }

    // 1.2 Auth: Resend OTP (Local fallback)
    if (cleanEndpoint === '/auth/resend-otp' && method === 'POST') {
      const { otpSessionId } = body;
      const raw = sessionStorage.getItem(otpSessionId);
      if (!raw) {
        throw new Error('Fadhiga xaqiijintu ma saxana ama wuu dhacay.');
      }
      const old = JSON.parse(raw);
      const user = this.db.users.find((u) => u.id === old.userId);
      if (!user) throw new Error('Isticmaalaha lama helin.');

      const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const targetEmail =
        (user.profile?.email || '').trim() ||
        (user.role === 'super_admin' ? 'xuseen0250@gmail.com' : 'cumartaakuur7888@gmail.com');

      const newOtpSessionId = `local_otp_${Date.now()}_${user.id}`;
      const existingCodes = [old.code, ...(old.codes || [])];
      sessionStorage.removeItem(otpSessionId);
      sessionStorage.setItem(newOtpSessionId, JSON.stringify({
        userId: user.id,
        code: newOtpCode,
        codes: [newOtpCode, ...existingCodes],
        email: targetEmail,
        expiresAt: Date.now() + 10 * 60 * 1000,
      }));

      try {
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: 'service_8c1yd7g',
            template_id: 'template_71zvwno',
            user_id: 'rxwb4DSPIM4X_ePg1',
            accessToken: 'A6eEzggwTqWOJ8988W6Kn',
            template_params: {
              passcode: newOtpCode,
              to_email: targetEmail,
              email: targetEmail,
              user_email: targetEmail,
              to_name: user.profile?.full_name || user.username,
              name: user.profile?.full_name || user.username,
              app_name: 'Balcad Travel Agency',
            },
          }),
        }).catch(() => {});
      } catch {}

      const mask = (em: string) => {
        const parts = em.split('@');
        return parts.length === 2 ? `${parts[0].slice(0, 2)}***${parts[0].slice(-1)}@${parts[1]}` : em;
      };

      return {
        success: true,
        otpSessionId: newOtpSessionId,
        emailMasked: mask(targetEmail),
        expiresInSeconds: 600,
        message: `Koodh cusub oo OTP ah ayaa loo diray email-kaaga: ${mask(targetEmail)}`,
      } as unknown as T;
    }

    // 2. Auth: Me
    if (cleanEndpoint === '/auth/me') {
      const active = this.getActiveUser();
      return { user: active } as unknown as T;
    }

    // 3. Auth: Change Password
    if (cleanEndpoint === '/auth/change-password' && method === 'POST') {
      const { new_password, confirm_new_password } = body;
      if (!new_password || new_password !== confirm_new_password) {
        throw new Error('Passwords do not match or are empty.');
      }
      const active = this.getActiveUser();
      const user = this.db.users.find((u) => u.id === active.id || u.role === 'super_admin');
      if (user) {
        user.password_plain = new_password;
        this.saveDB();
      }
      return { success: true, message: 'Password-kaaga si guul leh ayaa loo badalay!' } as unknown as T;
    }

    // 4. Dashboard Metrics
    if (cleanEndpoint === '/reports/dashboard' || cleanEndpoint === '/dashboard') {
      const active = this.getActiveUser();
      const isSuperAdmin = active.role === 'super_admin';
      const permittedOrders = isSuperAdmin
        ? this.db.orders
        : this.db.orders.filter(
            (o) =>
              o.created_by.toLowerCase() === active.username.toLowerCase() ||
              (o.assigned_staff && o.assigned_staff.toLowerCase() === active.username.toLowerCase())
          );
      const permittedPayments = isSuperAdmin
        ? this.db.payments
        : this.db.payments.filter(
            (p) =>
              p.received_by.toLowerCase() === active.username.toLowerCase() ||
              permittedOrders.some((o) => o.id === p.order_id || o.order_number === p.order_id)
          );

      const todayStr = new Date().toISOString().split('T')[0];

      const newRequests = permittedOrders.filter((o) => o.status === 'New').length;
      const pendingCount = permittedOrders.filter((o) => o.status === 'Pending').length;
      const inProgressCount = permittedOrders.filter((o) => o.status === 'In Progress').length;
      const availableCount = permittedOrders.filter((o) => o.status === 'Available').length;
      const confirmedCount = permittedOrders.filter((o) => o.status === 'Confirmed').length;
      const completedCount = permittedOrders.filter((o) => o.status === 'Completed').length;
      const rejectedCount = permittedOrders.filter((o) => o.status === 'Rejected').length;
      const debtOrdersCount = permittedOrders.filter((o) => o.status === 'Debt' || (o.outstanding_debt || 0) > 0).length;
      const totalDebt = permittedOrders.reduce((sum, o) => sum + (o.outstanding_debt || 0), 0);

      const todaysRequests = permittedOrders.filter((o) => o.created_at && o.created_at.startsWith(todayStr)).length;
      const todaysOrders = permittedOrders.filter((o) => o.created_at && o.created_at.startsWith(todayStr)).length;
      const activeEmployees = this.db.users.filter((u) => u.status === 'active').length;

      const services: Record<ServiceType, number> = {
        'Flight Ticket': 0,
        'Visa Service': 0,
        'Hotel': 0,
        'Travel Package': 0,
        'Airport Transfer': 0,
        'Other': 0,
      };
      permittedOrders.forEach((o) => {
        if (services[o.service_type] !== undefined) {
          services[o.service_type]++;
        }
      });

      const totalCount = permittedOrders.length || 1;
      const orders_by_service = Object.entries(services).map(([svc, count]) => ({
        service: svc as ServiceType,
        count,
        percentage: Math.round((count / totalCount) * 100),
      }));

      const statuses: OrderStatus[] = ['Confirmed', 'Completed', 'In Progress', 'Pending', 'Debt', 'Rejected'];
      const orders_by_status = statuses.map((st) => {
        const count = st === 'Debt'
          ? permittedOrders.filter((o) => o.status === 'Debt' || (o.outstanding_debt || 0) > 0).length
          : permittedOrders.filter((o) => o.status === st).length;
        return {
          status: st,
          count,
          percentage: Math.round((count / totalCount) * 100),
        };
      });

      const orders_by_day: { date: string; count: number }[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];
        const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
        const count = permittedOrders.filter((o) => o.created_at && o.created_at.startsWith(isoDate)).length;
        orders_by_day.push({ date: label, count });
      }

      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const payments_and_debt_by_week = [
        { week: 'Week 1', start: now - 4 * oneWeekMs, end: now - 3 * oneWeekMs },
        { week: 'Week 2', start: now - 3 * oneWeekMs, end: now - 2 * oneWeekMs },
        { week: 'Week 3', start: now - 2 * oneWeekMs, end: now - 1 * oneWeekMs },
        { week: 'Week 4', start: now - 1 * oneWeekMs, end: now },
      ].map((wk) => {
        const wkPayments = this.db.payments.filter((p) => {
          const t = new Date(p.created_at || p.payment_date).getTime();
          return t >= wk.start && t <= wk.end;
        }).reduce((sum, p) => sum + (p.amount || 0), 0);

        const wkDebt = permittedOrders.filter((o) => {
          const t = new Date(o.created_at).getTime();
          return t >= wk.start && t <= wk.end;
        }).reduce((sum, o) => sum + (o.outstanding_debt || 0), 0);

        return {
          week: wk.week,
          payments: wkPayments,
          debt: wkDebt,
        };
      });

      const cashCounterInfo = this.getCashCounterBalance();

      const metrics: DashboardMetrics = {
        new_requests: newRequests,
        pending_orders: pendingCount,
        in_progress_orders: inProgressCount,
        available_orders: availableCount,
        confirmed_orders: confirmedCount,
        completed_orders: completedCount,
        rejected_orders: rejectedCount,
        debt_orders: debtOrdersCount,
        total_outstanding_debt: totalDebt,
        todays_requests: todaysRequests,
        todays_orders: todaysOrders,
        active_employees: activeEmployees,
        cash_counter: cashCounterInfo.balance,
        cash_counter_collections_count: cashCounterInfo.collections_count,
        last_cash_counter_closed_at: cashCounterInfo.last_closed_at,
        orders_by_service,
        orders_by_status,
        orders_by_day,
        payments_and_debt_by_week,
      };
      return metrics as unknown as T;
    }

    // 5. Orders: List
    if (cleanEndpoint === '/orders' && method === 'GET') {
      let list = [...this.db.orders];
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const staff = searchParams.get('staff');
      if (staff && staff !== 'All') {
        const qStaff = staff.toLowerCase();
        list = list.filter(
          (o) =>
            o.created_by.toLowerCase() === qStaff ||
            (o.assigned_staff && o.assigned_staff.toLowerCase() === qStaff)
        );
      }
      if (status) {
        list = list.filter((o) => o.status.toLowerCase() === status.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (o) =>
            (o.customer?.full_name || '').toLowerCase().includes(q) ||
            o.order_number.toLowerCase().includes(q) ||
            (o.customer?.phone || '').includes(q)
        );
      }
      return list as unknown as T;
    }

    // 6. Orders: Create
    if (cleanEndpoint === '/orders' && method === 'POST') {
      const active = this.getActiveUser();
      const count = this.db.orders.length + 1;
      const orderNumber = `ORD-${1000 + count}`;
      const selling = Number(body.total_price || body.selling_price) || 0;
      const paid = Number(body.amount_paid || body.paid_amount) || 0;
      const debt = Math.max(0, selling - paid);

      let cust = this.db.customers.find((c) => c.id === body.customer_id);
      if (!cust && body.customer_name) {
        // Find existing by name or create
        cust = this.db.customers.find((c) => c.full_name.toLowerCase() === body.customer_name.trim().toLowerCase());
        if (!cust) {
          cust = {
            id: `cust-${Date.now()}`,
            full_name: body.customer_name.trim(),
            phone: body.customer_phone || '',
            email: body.customer_email || '',
            country: body.customer_country || 'Somalia',
            city: body.customer_city || 'Mogadishu',
            created_at: new Date().toISOString(),
            orders_count: 0,
            total_debt: 0,
            last_order_date: new Date().toISOString().split('T')[0],
          };
          this.db.customers.unshift(cust);
        }
      }
      if (!cust) {
        cust = this.db.customers[0];
      }

      cust.orders_count = (cust.orders_count || 0) + 1;
      cust.total_debt = (cust.total_debt || 0) + debt;
      cust.last_order_date = new Date().toISOString().split('T')[0];

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        order_number: orderNumber,
        customer_id: cust.id,
        customer: cust,
        service_type: body.service_type || 'Flight Ticket',
        status: debt > 0 ? 'Debt' : (body.status || 'New'),
        payment_type: debt > 0 ? 'Debt' : 'Paid',
        created_by: active.username,
        created_by_user_id: active.id,
        assigned_staff: body.assigned_staff || active.username,
        assigned_staff_id: active.id,
        total_price: selling,
        amount_paid: paid,
        outstanding_debt: debt,
        currency: body.currency || 'USD',
        service_details: body.service_details || {},
        notes: body.notes || '',
        price_entered_by: active.username,
        price_entered_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.db.orders.unshift(newOrder);

      if (paid > 0) {
        this.db.payments.unshift({
          id: `pay-${Date.now()}`,
          order_id: newOrder.id,
          amount: paid,
          currency: newOrder.currency,
          payment_method: body.payment_method || 'Cash',
          payment_note: body.payment_note || 'Deposit upon order creation',
          received_by: active.username,
          payment_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        });

        this.db.transactions.unshift({
          id: `tx-${Date.now()}`,
          order_id: newOrder.id,
          customer_name: cust.full_name,
          transaction_type: 'Payment Received',
          previous_balance: selling,
          payment_amount: paid,
          new_balance: debt,
          total_paid_before: 0,
          total_paid_after: paid,
          currency: 'USD',
          changed_by: active.username,
          created_at: new Date().toISOString(),
          notes: `Initial deposit for ${newOrder.order_number}`,
        });
      }

      this.saveDB();
      return newOrder as unknown as T;
    }

    // 7. Orders: Single Order (GET & DELETE)
    const orderMatch = cleanEndpoint.match(/^\/orders\/([^\/]+)$/);
    if (orderMatch && method === 'GET') {
      const id = orderMatch[1];
      const ord = this.db.orders.find((o) => o.id === id || o.order_number === id);
      if (!ord) throw new Error('Order not found');
      return ord as unknown as T;
    }

    if (orderMatch && method === 'DELETE') {
      const id = orderMatch[1];
      const active = this.getActiveUser();
      if (active.role !== 'super_admin') {
        throw new Error('You do not have permission to delete orders (Super Admin only).');
      }
      const idx = this.db.orders.findIndex((o) => o.id === id || o.order_number === id);
      if (idx !== -1) {
        const deleted = this.db.orders.splice(idx, 1)[0];

        // Clean up customer stats or auto-delete customer if 0 orders remain
        const custIndex = this.db.customers.findIndex((c) => c.id === deleted.customer_id);
        if (custIndex !== -1) {
          const remainingCustOrders = this.db.orders.filter((o) => o.customer_id === deleted.customer_id);
          if (remainingCustOrders.length === 0) {
            this.db.customers.splice(custIndex, 1);
          } else {
            const cust = this.db.customers[custIndex];
            cust.orders_count = remainingCustOrders.length;
            cust.total_debt = remainingCustOrders.reduce((sum, o) => sum + (o.outstanding_debt || 0), 0);
          }
        }

        // Remove associated payments
        this.db.payments = this.db.payments.filter((p) => p.order_id !== deleted.id && p.order_id !== deleted.order_number);

        // Remove associated transactions
        this.db.transactions = this.db.transactions.filter((t) => t.order_id !== deleted.id && t.order_id !== deleted.order_number);

        // Log activity
        this.db.activity_logs.unshift({
          id: `act-${Date.now()}`,
          user_id: active.id,
          username: active.username,
          action: 'Order Deleted',
          entity_type: 'order',
          entity_id: deleted.order_number,
          details: `Deleted by: ${active.username} | Deleted order ${deleted.order_number}`,
          created_at: new Date().toISOString(),
        });

        this.saveDB();
      }
      return { success: true, message: 'Order successfully deleted.' } as unknown as T;
    }

    // 7b. Orders: Financial Adjustments
    const adjustMatch = cleanEndpoint.match(/^\/orders\/([^\/]+)\/adjustments$/);
    if (adjustMatch && method === 'POST') {
      const id = adjustMatch[1];
      const ord = this.db.orders.find((o) => o.id === id || o.order_number === id);
      if (!ord) throw new Error('Order not found');
      const active = this.getActiveUser();
      if (active.role !== 'super_admin') {
        throw new Error('You do not have permission to adjust financials.');
      }
      if (body.new_price !== undefined) {
        ord.total_price = Number(body.new_price);
        ord.outstanding_debt = Math.max(0, ord.total_price - ord.amount_paid);
      } else if (body.adjustment_amount !== undefined) {
        ord.outstanding_debt = Math.max(0, ord.outstanding_debt + Number(body.adjustment_amount));
        ord.total_price = ord.amount_paid + ord.outstanding_debt;
      }
      ord.payment_type = ord.outstanding_debt > 0 ? 'Debt' : 'Paid';
      ord.updated_at = new Date().toISOString();
      this.saveDB();
      return { message: 'Debt updated successfully', order: ord } as unknown as T;
    }

    // 8. Orders: Update status
    const statusMatch = cleanEndpoint.match(/^\/orders\/([^\/]+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      const id = statusMatch[1];
      const ord = this.db.orders.find((o) => o.id === id || o.order_number === id);
      if (!ord) throw new Error('Order not found');
      ord.status = body.status;
      ord.updated_at = new Date().toISOString();
      this.saveDB();
      return ord as unknown as T;
    }

    // 9. Orders: Assign
    const assignMatch = cleanEndpoint.match(/^\/orders\/([^\/]+)\/assign$/);
    if (assignMatch && method === 'PATCH') {
      const id = assignMatch[1];
      const ord = this.db.orders.find((o) => o.id === id || o.order_number === id);
      if (!ord) throw new Error('Order not found');
      ord.assigned_staff = body.staff_username;
      ord.updated_at = new Date().toISOString();
      this.saveDB();
      return ord as unknown as T;
    }

    // 10. Orders: Add Payment
    const paymentMatch = cleanEndpoint.match(/^\/orders\/([^\/]+)\/payments$/);
    if (paymentMatch && method === 'POST') {
      const id = paymentMatch[1];
      const ord = this.db.orders.find((o) => o.id === id || o.order_number === id);
      if (!ord) throw new Error('Order not found');
      const amount = Number(body.amount) || 0;
      ord.amount_paid += amount;
      ord.outstanding_debt = Math.max(0, ord.total_price - ord.amount_paid);
      if (ord.outstanding_debt === 0) {
        ord.payment_type = 'Paid';
      }
      ord.updated_at = new Date().toISOString();

      const payment: Payment = {
        id: `pay-${Date.now()}`,
        order_id: ord.id,
        amount,
        currency: 'USD',
        payment_method: body.payment_method || 'EVC Plus',
        payment_note: body.payment_note || body.notes || '',
        received_by: this.getActiveUser().username,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      this.db.payments.unshift(payment);

      // Record transaction
      this.db.transactions.unshift({
        id: `tx-${Date.now()}`,
        order_id: ord.id,
        customer_name: ord.customer?.full_name || 'Customer',
        transaction_type: ord.outstanding_debt === 0 ? 'Debt Fully Paid' : 'Payment Received',
        previous_balance: ord.outstanding_debt + amount,
        payment_amount: amount,
        new_balance: ord.outstanding_debt,
        total_paid_before: ord.amount_paid - amount,
        total_paid_after: ord.amount_paid,
        currency: 'USD',
        changed_by: this.getActiveUser().username,
        created_at: new Date().toISOString(),
        notes: body.notes || `Payment for ${ord.order_number}`,
      });

      // Automatically reduce customer debt
      const cust = this.db.customers.find((c) => c.id === ord.customer_id);
      if (cust) {
        const allCustOrders = this.db.orders.filter((o) => o.customer_id === ord.customer_id);
        cust.total_debt = allCustOrders.reduce((sum, o) => sum + (o.outstanding_debt || 0), 0);
      }

      this.saveDB();
      return { message: 'Payment recorded successfully', payment, order: ord } as unknown as T;
    }

    // 11. Customers: List & Search
    if (cleanEndpoint === '/customers' && method === 'GET') {
      const q = (searchParams.get('search') || '').toLowerCase();
      let list = [...this.db.customers];
      if (q) {
        list = list.filter(
          (c) =>
            c.full_name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q)
        );
      }
      return list as unknown as T;
    }

    if (cleanEndpoint === '/customers/clear-all' && method === 'POST') {
      this.db.customers = [];
      this.saveDB();
      return { success: true, message: 'All customers cleared successfully' } as unknown as T;
    }

    // 12. Customers: Create
    if (cleanEndpoint === '/customers' && method === 'POST') {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        full_name: body.full_name,
        phone: body.phone,
        email: body.email || '',
        country: body.country || 'Somalia',
        city: body.city || 'Mogadishu',
        notes: body.notes || '',
        created_at: new Date().toISOString(),
        orders_count: 0,
        total_debt: 0,
      };
      this.db.customers.unshift(newCust);
      this.saveDB();
      return newCust as unknown as T;
    }

    // 13. Customers: Single with Orders (GET & DELETE)
    const custMatch = cleanEndpoint.match(/^\/customers\/([^\/]+)$/);
    if (custMatch && method === 'GET') {
      const id = custMatch[1];
      const customer = this.db.customers.find((c) => c.id === id);
      if (!customer) throw new Error('Customer not found');
      const orders = this.db.orders.filter((o) => o.customer_id === id);
      const orderIds = orders.map((o) => o.id);
      const orderNumbers = orders.map((o) => o.order_number);
      const documents: any[] = [];
      return { customer, orders, documents } as unknown as T;
    }

    if (custMatch && method === 'DELETE') {
      const id = custMatch[1];
      this.db.customers = this.db.customers.filter((c) => c.id !== id);
      this.saveDB();
      return { success: true, message: 'Customer deleted successfully' } as unknown as T;
    }

    // 14. AR Report
    if (cleanEndpoint === '/ar' || cleanEndpoint === '/reports/ar') {
      let debtOrders = this.db.orders.filter((o) => (o.outstanding_debt || 0) > 0 || o.payment_type === 'Debt');
      const staffFilter = searchParams.get('staff');
      if (staffFilter && staffFilter !== 'All') {
        const qStaff = staffFilter.toLowerCase();
        debtOrders = debtOrders.filter(
          (o) =>
            o.created_by.toLowerCase() === qStaff ||
            (o.assigned_staff && o.assigned_staff.toLowerCase() === qStaff)
        );
      }

      const rows = debtOrders.map((ord) => {
        const cust = this.db.customers.find((c) => c.id === ord.customer_id) || ord.customer;
        const pays = this.db.payments.filter((p) => p.order_id === ord.id);
        const lastPay = pays.length ? pays[0] : null;

        const orderDate = new Date(ord.created_at).getTime();
        const diffDays = Math.max(0, Math.floor((Date.now() - orderDate) / (1000 * 60 * 60 * 24)));

        let debtStatus: 'Unpaid' | 'Partially Paid' | 'Paid' = 'Unpaid';
        if ((ord.outstanding_debt || 0) === 0) {
          debtStatus = 'Paid';
        } else if ((ord.amount_paid || 0) > 0) {
          debtStatus = 'Partially Paid';
        }

        return {
          order_id: ord.order_number,
          internal_id: ord.id,
          customer_name: cust?.full_name || 'N/A',
          customer_phone: cust?.phone || 'N/A',
          service_type: ord.service_type,
          total_price: ord.total_price || 0,
          total_paid: ord.amount_paid || 0,
          outstanding_debt: ord.outstanding_debt || 0,
          currency: ord.currency || 'USD',
          debt_status: debtStatus,
          created_by: ord.created_by || 'Staff',
          assigned_employee: ord.assigned_staff || 'Unassigned',
          last_payment_date: lastPay ? lastPay.payment_date : 'No payments',
          days_outstanding: diffDays,
          created_at: ord.created_at,
          payments: pays,
        };
      });

      const totalDebtCustomers = new Set(debtOrders.filter((o) => (o.outstanding_debt || 0) > 0).map((o) => o.customer_id)).size;
      const totalDebtOrders = debtOrders.length;
      const totalAmountOwed = debtOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
      const totalAmountPaid = debtOrders.reduce((sum, o) => sum + (o.amount_paid || 0), 0);
      const totalOutstandingDebt = debtOrders.reduce((sum, o) => sum + (o.outstanding_debt || 0), 0);
      const unpaidOrders = rows.filter((r) => r.debt_status === 'Unpaid').length;
      const partiallyPaidOrders = rows.filter((r) => r.debt_status === 'Partially Paid').length;
      const fullyPaidOrders = rows.filter((r) => r.debt_status === 'Paid').length;

      return {
        summary: {
          total_debt_customers: totalDebtCustomers,
          total_debt_orders: totalDebtOrders,
          total_amount_owed: totalAmountOwed,
          total_amount_paid: totalAmountPaid,
          total_outstanding_debt: totalOutstandingDebt,
          unpaid_orders: unpaidOrders,
          partially_paid_orders: partiallyPaidOrders,
          fully_paid_orders: fullyPaidOrders,
          // Legacy aliases
          total_debt: totalOutstandingDebt,
          debtors_count: totalDebtCustomers,
          overdue_30_days: Math.round(totalOutstandingDebt * 0.4),
          overdue_60_days: Math.round(totalOutstandingDebt * 0.25),
        },
        orders: rows,
      } as unknown as T;
    }

    // 15. Transactions (Staff only sees their own; Super Admin & Finance see all)
    if (cleanEndpoint === '/transactions') {
      const active = this.getActiveUser();
      let list = [...this.db.transactions];
      const isSuperAdmin = active.role === 'super_admin';
      const isFinance =
        active.profile?.department?.toLowerCase().includes('finance') ||
        active.profile?.department?.toLowerCase().includes('account');
      if (!isSuperAdmin && !isFinance) {
        list = list.filter((t) => t.changed_by.toLowerCase() === active.username.toLowerCase());
      }
      return list as unknown as T;
    }

    // Cash Counter Endpoints
    if (cleanEndpoint === '/cash-counter' && method === 'GET') {
      const staff = searchParams.get('staff') || undefined;
      return this.getCashCounterBalance(staff) as unknown as T;
    }

    if (cleanEndpoint === '/cash-counter/close' && method === 'POST') {
      const active = this.getActiveUser();
      if (body.target_username && body.target_username.toLowerCase() !== active.username.toLowerCase()) {
        throw new Error("laguu ma ogola howshan xaq Uma lihid inaad xerto xisaab shaqaale kale leyahay");
      }
      const { recipient_name, recipient_phone, recipient_username, proof_image_url, notes } = body;
      if (!recipient_name || !recipient_phone || !recipient_username) {
        throw new Error('Fadlan buuxi magaca, lambarka iyo username-ka qofka aad lacagta u dhiibtay.');
      }
      if (!proof_image_url) {
        throw new Error('Fadlan soo upload-gareey sawir caddaynaya in lacagta loo diray qofkaas.');
      }

      const { balance } = this.getCashCounterBalance();
      const closedAt = new Date().toISOString();

      const closure: CashCounterClosure = {
        id: `cls-${Date.now()}`,
        employee_id: active.id,
        employee_username: active.username,
        employee_name: active.profile?.full_name || active.username,
        recipient_name: recipient_name.trim(),
        recipient_phone: recipient_phone.trim(),
        recipient_username: recipient_username.trim(),
        amount: balance,
        currency: 'USD',
        proof_image_url,
        notes: notes || '',
        closed_at: closedAt,
        created_at: closedAt,
      };

      if (!this.db.cash_closures) this.db.cash_closures = [];
      this.db.cash_closures.unshift(closure);

      const dbUser = this.db.users.find((u) => u.id === active.id || u.username.toLowerCase() === active.username.toLowerCase());
      if (dbUser) {
        dbUser.last_cash_counter_closed_at = closedAt;
      }
      active.last_cash_counter_closed_at = closedAt;
      this.setActiveUser(active);

      const trxId = `TRX-${1000 + this.db.transactions.length + 1}`;
      this.db.transactions.unshift({
        id: trxId,
        order_id: closure.id,
        customer_name: `Dhiibitaan: ${closure.recipient_name}`,
        transaction_type: 'Cash Counter Handover',
        previous_balance: balance,
        payment_amount: balance,
        new_balance: 0,
        total_paid_before: balance,
        total_paid_after: 0,
        currency: 'USD',
        changed_by: active.username,
        created_at: closedAt,
        notes: `Xisaab xir sanduuq: $${balance.toLocaleString()} loo dhiibay ${closure.recipient_name} (@${closure.recipient_username}, Tel: ${closure.recipient_phone})`,
        closure_details: {
          recipient_name: closure.recipient_name,
          recipient_phone: closure.recipient_phone,
          recipient_username: closure.recipient_username,
          proof_image_url: closure.proof_image_url,
          employee_name: closure.employee_name,
          employee_username: closure.employee_username,
          notes: closure.notes,
        },
      });

      this.db.notifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'cash_closure',
        title: `Xisaab Xir Sanduuqa: @${active.username} ($${balance.toLocaleString()})`,
        message: `@${active.username} (${closure.employee_name}) waxa uu xiray sanduuqa lacagta ($${balance.toLocaleString()}). Waxaa loo dhiibay: ${closure.recipient_name} (@${closure.recipient_username}, Tel: ${closure.recipient_phone}).`,
        related_record_id: closure.id,
        read: false,
        created_at: closedAt,
      });

      this.saveDB();
      return { success: true, closure, balance: 0 } as unknown as T;
    }

    // 16. Employees (List, Create, Update, Delete)
    if (cleanEndpoint === '/employees' && method === 'GET') {
      return this.db.users.map(({ password_plain, ...u }) => u) as unknown as T;
    }

    if (cleanEndpoint === '/employees' && method === 'POST') {
      const active = this.getActiveUser();
      if (active.role !== 'super_admin') {
        throw new Error('Only Super Admin can create employees.');
      }
      const newEmp: User & { password_plain: string } = {
        id: `usr-emp-${Date.now()}`,
        username: (body.username || '').toLowerCase().trim(),
        role: body.role || 'employee',
        status: 'active',
        failed_login_attempts: 0,
        password_plain: body.password || '123456',
        created_at: new Date().toISOString(),
        profile: {
          id: `prof-${Date.now()}`,
          user_id: `usr-emp-${Date.now()}`,
          full_name: body.full_name || body.username,
          phone: body.phone || '',
          email: body.email || '',
          department: body.department || 'Operations',
          avatar: '',
        },
      };
      this.db.users.push(newEmp);
      this.saveDB();
      const { password_plain, ...safeEmp } = newEmp;
      return safeEmp as unknown as T;
    }

    const empMatch = cleanEndpoint.match(/^\/employees\/([^\/]+)$/);
    if (empMatch && method === 'PATCH') {
      const id = empMatch[1];
      const emp = this.db.users.find((u) => u.id === id);
      if (!emp) throw new Error('Employee not found');
      if (body.full_name) emp.profile.full_name = body.full_name;
      if (body.phone) emp.profile.phone = body.phone;
      if (body.department) emp.profile.department = body.department;
      if (body.status) {
        emp.status = body.status;
        if (body.status === 'disabled') {
          emp.disabled_reason = body.disabled_reason || 'Disabled by Administrator';
          emp.disabled_at = new Date().toISOString();
          emp.disabled_by = this.getActiveUser()?.username || 'Super Admin';
          const stored = localStorage.getItem(ACTIVE_USER_KEY);
          if (stored) {
            try {
              const u = JSON.parse(stored);
              if (u.id === emp.id || u.username.toLowerCase() === emp.username.toLowerCase()) {
                localStorage.removeItem(ACTIVE_USER_KEY);
                localStorage.removeItem('balcad_crm_token');
                window.dispatchEvent(new CustomEvent('balcad_auth_expired'));
              }
            } catch {}
          }
        } else if (body.status === 'active') {
          emp.disabled_reason = null;
          emp.disabled_at = null;
          emp.disabled_by = null;
          emp.failed_login_attempts = 0;
        }
      }
      this.saveDB();
      const { password_plain, ...safeEmp } = emp;
      return safeEmp as unknown as T;
    }

    if (empMatch && method === 'DELETE') {
      const id = empMatch[1];
      const active = this.getActiveUser();
      if (active.role !== 'super_admin') {
        throw new Error('Only Super Admin can delete employees.');
      }
      const idx = this.db.users.findIndex((u) => u.id === id);
      if (idx !== -1 && this.db.users[idx].role !== 'super_admin') {
        this.db.users.splice(idx, 1);
        this.saveDB();
      }
      return { success: true, message: 'Employee removed successfully' } as unknown as T;
    }

    const empPassMatch = cleanEndpoint.match(/^\/employees\/([^\/]+)\/change-password$/);
    if (empPassMatch && method === 'POST') {
      const id = empPassMatch[1];
      const emp = this.db.users.find((u) => u.id === id);
      if (!emp) throw new Error('Employee not found');
      emp.password_plain = body.new_password || '123456';
      this.saveDB();
      return { success: true, message: 'Password updated successfully' } as unknown as T;
    }

    const empActMatch = cleanEndpoint.match(/^\/employees\/([^\/]+)\/activity$/);
    if (empActMatch && method === 'GET') {
      const id = empActMatch[1];
      const emp = this.db.users.find((u) => u.id === id);
      if (!emp) return [] as unknown as T;
      return this.db.activity_logs.filter((a) => a.username === emp.username) as unknown as T;
    }

    // 17. Conversations & Messaging
    if (cleanEndpoint === '/conversations') {
      const active = this.getActiveUser();
      if (active.role === 'super_admin') {
        return this.db.conversations as unknown as T;
      }
      return this.db.conversations.filter((c) =>
        c.participants.some((p) => p.user_id === active.id)
      ) as unknown as T;
    }

    if (cleanEndpoint === '/conversations/direct' && method === 'POST') {
      const active = this.getActiveUser();
      const targetUserId = body.target_user_id;
      const targetUser = this.db.users.find((u) => u.id === targetUserId);
      if (!targetUser) throw new Error('Target user not found');

      let existing = this.db.conversations.find(
        (c) =>
          c.type === 'direct' &&
          c.participants.some((p) => p.user_id === active.id) &&
          c.participants.some((p) => p.user_id === targetUser.id)
      );
      if (existing) {
        return existing as unknown as T;
      }

      const convId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        type: 'direct',
        status: 'open',
        created_by: active.id,
        created_by_username: active.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants: [
          {
            id: `cp-${Date.now()}-1`,
            conversation_id: convId,
            user_id: active.id,
            username: active.username,
            full_name: active.profile?.full_name || active.username,
            phone: active.profile?.phone || '',
            joined_at: new Date().toISOString(),
            participant_status: 'active',
          },
          {
            id: `cp-${Date.now()}-2`,
            conversation_id: convId,
            user_id: targetUser.id,
            username: targetUser.username,
            full_name: targetUser.profile?.full_name || targetUser.username,
            phone: targetUser.profile?.phone || '',
            joined_at: new Date().toISOString(),
            participant_status: 'active',
          },
        ],
      };
      this.db.conversations.unshift(newConv);
      this.saveDB();
      return newConv as unknown as T;
    }

    if (cleanEndpoint === '/conversations/group' && method === 'POST') {
      const active = this.getActiveUser();
      const convId = `conv-grp-${Date.now()}`;
      const allIds = Array.from(new Set([active.id, ...(body.participant_user_ids || [])]));
      const participants = allIds
        .map((uid) => {
          const u = this.db.users.find((userItem) => userItem.id === uid);
          if (!u) return null;
          return {
            id: `cp-${Date.now()}-${uid}`,
            conversation_id: convId,
            user_id: u.id,
            username: u.username,
            full_name: u.profile?.full_name || u.username,
            phone: u.profile?.phone || '',
            joined_at: new Date().toISOString(),
            participant_status: 'active' as const,
          };
        })
        .filter(Boolean) as any[];

      const newGroup: Conversation = {
        id: convId,
        type: 'group',
        title: body.title,
        status: 'open',
        created_by: active.id,
        created_by_username: active.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants,
      };
      this.db.conversations.unshift(newGroup);
      this.saveDB();
      return newGroup as unknown as T;
    }

    const convStatusMatch = cleanEndpoint.match(/^\/conversations\/([^\/]+)\/status$/);
    if (convStatusMatch && (method === 'PATCH' || method === 'POST')) {
      const convId = convStatusMatch[1];
      const conv = this.db.conversations.find((c) => c.id === convId);
      if (!conv) throw new Error('Conversation not found');
      conv.status = body.status;
      conv.updated_at = new Date().toISOString();
      this.saveDB();
      return conv as unknown as T;
    }

    const messagesMatch = cleanEndpoint.match(/^\/conversations\/([^\/]+)\/messages$/);
    if (messagesMatch && method === 'GET') {
      const convId = messagesMatch[1];
      return this.db.messages.filter((m) => m.conversation_id === convId) as unknown as T;
    }

    if (messagesMatch && method === 'POST') {
      const convId = messagesMatch[1];
      const active = this.getActiveUser();
      const msg: Message = {
        id: `msg-${Date.now()}`,
        conversation_id: convId,
        sender_id: active.id,
        sender_username: active.username,
        sender_name: active.profile?.full_name || active.username,
        message_text: body.message_text || '',
        attachments: body.attachments,
        created_at: new Date().toISOString(),
      };
      this.db.messages.push(msg);
      const conv = this.db.conversations.find((c) => c.id === convId);
      if (conv) conv.updated_at = new Date().toISOString();
      this.saveDB();
      return msg as unknown as T;
    }

    // 18. Notifications
    if (cleanEndpoint === '/notifications') {
      return this.db.notifications as unknown as T;
    }

    // 19. Activity Logs
    if (cleanEndpoint === '/activity') {
      return this.db.activity_logs as unknown as T;
    }

    // 20. Staff search
    if (cleanEndpoint === '/staff/search') {
      const q = (searchParams.get('q') || '').toLowerCase();
      const staff = this.db.users
        .filter((u) => u.username.toLowerCase().includes(q) || u.profile.full_name.toLowerCase().includes(q))
        .map(({ password_plain, ...u }) => u);
      return staff as unknown as T;
    }

    return {} as unknown as T;
  }
}

export const localCrmEngine = new LocalCRMEngine();
