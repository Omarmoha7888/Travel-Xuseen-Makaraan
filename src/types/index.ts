export type UserRole = 'super_admin' | 'employee';
export type AccountStatus = 'active' | 'disabled';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  status: AccountStatus;
  disabled_reason?: string | null;
  disabled_at?: string | null;
  disabled_by?: string | null;
  failed_login_attempts: number;
  lockout_until?: string | null;
  created_at: string;
  last_login?: string | null;
  last_cash_counter_closed_at?: string | null;
  profile: StaffProfile;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  department: string;
  avatar?: string;
}

export type ServiceType = 
  | 'Flight Ticket'
  | 'Visa Service'
  | 'Hotel'
  | 'Travel Package'
  | 'Airport Transfer'
  | 'Other';

export type OrderStatus =
  | 'New'
  | 'Pending'
  | 'In Progress'
  | 'Waiting for Customer'
  | 'Waiting for Documents'
  | 'Available'
  | 'Confirmed'
  | 'Completed'
  | 'Debt'
  | 'Rejected'
  | 'Cancelled';

export type PaymentType = 'Paid' | 'Debt';

export interface DebtModificationAudit {
  id: string;
  order_id: string;
  action_type:
    | 'creation'
    | 'status_change'
    | 'payment_received'
    | 'price_adjustment'
    | 'assignment'
    | 'document_uploaded';
  staff_username: string;
  timestamp: string;
  description: string;
  previous_debt: number;
  amount_changed?: number;
  debt_balance_after: number;
  total_price_after: number;
  total_paid_after: number;
  reason?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  notes?: string;
  created_at: string;
  orders_count?: number;
  total_debt?: number;
  last_order_date?: string;
  passport_image?: string;
  documents?: DocumentFile[];
}

export interface FlightDetails {
  departure_city: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  trip_type: 'one_way' | 'round_trip';
  adults: number;
  children: number;
  infants: number;
  airline_preference?: string;
  cabin_class: 'Economy' | 'Premium Economy' | 'Business' | 'First Class';
  passenger_names: string[];
  passport_numbers?: string[];
  additional_requirements?: string;
}

export interface VisaDetails {
  destination_country: string;
  visa_type: string;
  applicant_nationality: string;
  passport_status: string;
  intended_travel_date: string;
  applicants_count: number;
  required_documents: string[];
  additional_notes?: string;
}

export interface HotelDetails {
  destination: string;
  hotel_preference: string;
  check_in_date: string;
  check_out_date: string;
  rooms_count: number;
  guests_count: number;
  room_type: string;
  special_requirements?: string;
}

export interface TravelPackageDetails {
  destination: string;
  travel_dates: string;
  travelers_count: number;
  accommodation_requirements?: string;
  transport_requirements?: string;
  activities?: string;
  special_requirements?: string;
}

export interface AirportTransferDetails {
  pickup_location: string;
  destination: string;
  transfer_datetime: string;
  passengers_count: number;
  vehicle_type: string;
  flight_number?: string;
  special_requirements?: string;
}

export interface OtherServiceDetails {
  service_title: string;
  description: string;
  requirements?: string;
}

export type ServiceDetails =
  | { type: 'Flight Ticket'; data: FlightDetails }
  | { type: 'Visa Service'; data: VisaDetails }
  | { type: 'Hotel'; data: HotelDetails }
  | { type: 'Travel Package'; data: TravelPackageDetails }
  | { type: 'Airport Transfer'; data: AirportTransferDetails }
  | { type: 'Other'; data: OtherServiceDetails };

export interface Order {
  id: string;
  order_number: string; // e.g. BAL-2026-00001
  customer_id: string;
  customer?: Customer;
  service_type: ServiceType;
  status: OrderStatus;
  payment_type: PaymentType;
  created_by: string; // username
  created_by_user_id: string;
  assigned_staff: string | null; // username
  assigned_staff_id: string | null;
  total_price: number;
  amount_paid: number;
  outstanding_debt: number;
  currency: 'USD' | 'EUR' | 'SOS';
  service_details: any;
  notes: string;
  price_entered_by: string;
  price_entered_at: string;
  created_at: string;
  updated_at: string;
  passport_image?: string;
  documents?: DocumentFile[];
  status_history?: OrderStatusHistory[];
  assignment_history?: OrderAssignmentHistory[];
  payments?: Payment[];
  modifications_history?: DebtModificationAudit[];
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export interface OrderAssignmentHistory {
  id: string;
  order_id: string;
  previous_employee: string | null;
  new_employee: string | null;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'EVC Plus' | 'Zaad' | 'Sahal' | 'Other';
  payment_note: string;
  received_by: string; // username
  payment_date: string;
  created_at: string;
}

export interface CashCounterClosure {
  id: string;
  employee_id: string;
  employee_username: string;
  employee_name: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_username: string;
  amount: number;
  currency: string;
  proof_image_url: string;
  notes?: string;
  closed_at: string;
  created_at: string;
}

export type TransactionType =
  | 'Order Created'
  | 'Payment Received'
  | 'Partial Payment'
  | 'Debt Updated'
  | 'Debt Fully Paid'
  | 'Price Updated'
  | 'Financial Adjustment'
  | 'Cash Counter Handover';

export interface Transaction {
  id: string; // e.g. TRX-1001
  order_id: string;
  customer_name: string;
  payment_id?: string | null;
  transaction_type: TransactionType;
  previous_balance: number;
  payment_amount: number;
  new_balance: number;
  total_paid_before: number;
  total_paid_after: number;
  currency: string;
  changed_by: string; // username
  created_at: string;
  notes?: string;
  closure_details?: {
    recipient_name: string;
    recipient_phone: string;
    recipient_username: string;
    proof_image_url: string;
    employee_name: string;
    employee_username: string;
    notes?: string;
  };
}

export interface FinancialAdjustment {
  id: string;
  order_id: string;
  reason: string;
  previous_value: number;
  adjustment_amount: number;
  new_value: number;
  changed_by: string;
  created_at: string;
}

export interface DocumentFile {
  id: string;
  order_id: string;
  customer_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  status: 'open' | 'closed';
  created_by: string;
  created_by_username: string;
  closed_by?: string | null;
  closed_at?: string | null;
  reopened_by?: string | null;
  reopened_at?: string | null;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  username: string;
  full_name: string;
  phone: string;
  joined_at: string;
  participant_status: 'active' | 'left';
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  conversation_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  sender_name: string;
  message_text: string;
  created_at: string;
  attachments?: MessageAttachment[];
  read_by?: string[]; // user_ids
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  type: 'order' | 'assignment' | 'message' | 'status' | 'document' | 'payment' | 'chat' | 'cash_closure';
  title: string;
  message: string;
  related_record_id?: string | null;
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  entity_type: 'order' | 'employee' | 'customer' | 'payment' | 'messaging' | 'auth' | 'system';
  entity_id?: string;
  details: string;
  previous_value?: any;
  new_value?: any;
  created_at: string;
}

export interface DashboardMetrics {
  new_requests: number;
  pending_orders: number;
  in_progress_orders: number;
  available_orders: number;
  confirmed_orders: number;
  completed_orders: number;
  rejected_orders: number;
  debt_orders: number;
  total_outstanding_debt: number;
  todays_requests: number;
  todays_orders: number;
  active_employees: number;
  cash_counter?: number;
  cash_counter_collections_count?: number;
  last_cash_counter_closed_at?: string | null;
  orders_by_service: { service: ServiceType; count: number; percentage: number }[];
  orders_by_status: { status: OrderStatus; count: number; percentage: number }[];
  orders_by_day: { date: string; count: number }[];
  payments_and_debt_by_week: { week: string; payments: number; debt: number }[];
}

export type Language = 'en' | 'so' | 'ar';
export type ThemeMode = 'dark' | 'light';
