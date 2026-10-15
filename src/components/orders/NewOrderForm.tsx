import React, { useState, useRef } from 'react';
import {
  Plane,
  FileCheck,
  Hotel,
  Luggage,
  Car,
  HelpCircle,
  DollarSign,
  AlertCircle,
  Save,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { ServiceType, PaymentType } from '../../types';

interface NewOrderFormProps {
  onBack: () => void;
  onOrderCreated: (orderId: string) => void;
}

export const NewOrderForm: React.FC<NewOrderFormProps> = ({ onBack, onOrderCreated }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [serviceType, setServiceType] = useState<ServiceType>('Flight Ticket');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCountry, setCustomerCountry] = useState('Somalia');
  const [customerCity, setCustomerCity] = useState('Mogadishu');
  const [passportImage, setPassportImage] = useState<string>('');
  const [passportFileName, setPassportFileName] = useState<string>('');
  const passportInputRef = useRef<HTMLInputElement>(null);

  // Financial fields
  const [totalPrice, setTotalPrice] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('Paid');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'SOS'>('USD');
  const [paymentMethod, setPaymentMethod] = useState('Cash Counter');
  const [paymentNote, setPaymentNote] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');

  // Service Specific fields
  // Flight
  const [flightDepCity, setFlightDepCity] = useState('Mogadishu (MGQ)');
  const [flightDest, setFlightDest] = useState('Istanbul (IST)');
  const [flightDepDate, setFlightDepDate] = useState('');
  const [flightRetDate, setFlightRetDate] = useState('');
  const [flightTripType, setFlightTripType] = useState<'round_trip' | 'one_way'>('round_trip');
  const [flightAdults, setFlightAdults] = useState(1);
  const [flightChildren, setFlightChildren] = useState(0);
  const [flightInfants, setFlightInfants] = useState(0);
  const [flightAirline, setFlightAirline] = useState('Turkish Airlines');
  const [flightCabin, setFlightCabin] = useState<'Economy' | 'Premium Economy' | 'Business' | 'First Class'>('Economy');
  const [flightPassengers, setFlightPassengers] = useState('');

  // Visa
  const [visaCountry, setVisaCountry] = useState('Turkey');
  const [visaType, setVisaType] = useState('Tourist Visa');
  const [visaNationality, setVisaNationality] = useState('Somali');
  const [visaTravelDate, setVisaTravelDate] = useState('');
  const [visaApplicants, setVisaApplicants] = useState(1);
  const [visaDocuments, setVisaDocuments] = useState('Passport, Photo, Bank Statement');

  // Hotel
  const [hotelDest, setHotelDest] = useState('Dubai, UAE');
  const [hotelPref, setHotelPref] = useState('');
  const [hotelCheckIn, setHotelCheckIn] = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelGuests, setHotelGuests] = useState(2);
  const [hotelRoomType, setHotelRoomType] = useState('Deluxe King');

  // Travel Package
  const [pkgDest, setPkgDest] = useState('Dubai Vacation');
  const [pkgDates, setPkgDates] = useState('');
  const [pkgTravelers, setPkgTravelers] = useState(2);
  const [pkgActivities, setPkgActivities] = useState('');

  // Transfer
  const [transPickup, setTransPickup] = useState('Aden Adde International Airport');
  const [transDest, setTransDest] = useState('Jazeera Palace Hotel');
  const [transDatetime, setTransDatetime] = useState('');
  const [transVehicle, setTransVehicle] = useState('Toyota Land Cruiser / VIP Van');

  // Other
  const [otherTitle, setOtherTitle] = useState('');
  const [otherDesc, setOtherDesc] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If amount paid is less than total price, encourage paymentType = Debt
  const calculatedDebt = Math.max(0, (Number(totalPrice) || 0) - (Number(amountPaid) || 0));

  const handleTotalPriceChange = (val: string) => {
    setTotalPrice(val);
    if (paymentType === 'Paid' && !amountPaid) {
      setAmountPaid(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Customer name and phone number are required.');
      return;
    }
    if (!passportImage) {
      setError('Fadlan soo upload-gareey sawirka baasaboorka (Sawirka baasaboorku waa qasab).');
      showToast('Fadlan soo upload-gareey sawirka baasaboorka macmiilka', 'error');
      return;
    }
    if (!totalPrice || Number(totalPrice) <= 0) {
      setError('Please provide a valid total price.');
      return;
    }

    setLoading(true);
    setError(null);

    // Build service details
    let service_details: any = {};
    if (serviceType === 'Flight Ticket') {
      service_details = {
        departure_city: flightDepCity,
        destination: flightDest,
        departure_date: flightDepDate,
        return_date: flightRetDate,
        trip_type: flightTripType,
        adults: flightAdults,
        children: flightChildren,
        infants: flightInfants,
        preferred_airline: flightAirline,
        cabin_class: flightCabin,
        passenger_names: flightPassengers.split(',').map((s) => s.trim()).filter(Boolean),
      };
    } else if (serviceType === 'Visa Service') {
      service_details = {
        destination_country: visaCountry,
        visa_type: visaType,
        applicant_nationality: visaNationality,
        intended_travel_date: visaTravelDate,
        applicants_count: visaApplicants,
        required_documents: visaDocuments.split(',').map((s) => s.trim()),
      };
    } else if (serviceType === 'Hotel') {
      service_details = {
        destination: hotelDest,
        hotel_preference: hotelPref,
        check_in_date: hotelCheckIn,
        check_out_date: hotelCheckOut,
        rooms_count: hotelRooms,
        guests_count: hotelGuests,
        room_type: hotelRoomType,
      };
    } else if (serviceType === 'Travel Package') {
      service_details = {
        destination: pkgDest,
        travel_dates: pkgDates,
        travelers_count: pkgTravelers,
        activities: pkgActivities,
      };
    } else if (serviceType === 'Airport Transfer') {
      service_details = {
        pickup_location: transPickup,
        destination: transDest,
        transfer_datetime: transDatetime,
        vehicle_type: transVehicle,
      };
    } else {
      service_details = {
        service_title: otherTitle,
        description: otherDesc,
      };
    }

    try {
      const created = await api.createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        customer_country: customerCountry,
        customer_city: customerCity,
        service_type: serviceType,
        total_price: Number(totalPrice),
        amount_paid: Number(amountPaid) || 0,
        payment_type: paymentType === 'Debt' || calculatedDebt > 0 ? 'Debt' : 'Paid',
        currency,
        payment_method: paymentMethod,
        payment_note: paymentNote,
        service_details,
        notes,
        passport_image: passportImage,
        assigned_staff: assignedStaff || null,
      });

      showToast(`Order ${created.order_number} created successfully!`, 'success');
      onOrderCreated(created.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create order.');
      showToast(err.message || 'Failed to create order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const services = [
    { type: 'Flight Ticket', icon: Plane, label: t('service_flight') },
    { type: 'Visa Service', icon: FileCheck, label: t('service_visa') },
    { type: 'Hotel', icon: Hotel, label: t('service_hotel') },
    { type: 'Travel Package', icon: Luggage, label: t('service_package') },
    { type: 'Airport Transfer', icon: Car, label: t('service_transfer') },
    { type: 'Other', icon: HelpCircle, label: t('service_other') },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>
        <span className="text-xs font-mono text-amber-400/80">New Order Creation</span>
      </div>

      <div className="bg-[#111726] border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mb-2">
          <Plane className="w-6 h-6 text-amber-400" />
          <span>Create New Travel Order</span>
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Create an internal booking record for customer requests received via Balcad Travel Agency.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Service Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              1. Select Service Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {services.map((s) => {
                const Icon = s.icon;
                const isSelected = serviceType === s.type;
                return (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => setServiceType(s.type as ServiceType)}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="text-xs">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Customer Information */}
          <div className="p-5 rounded-2xl bg-[#0C111E] border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>2. Customer Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ahmed Hassan Farah"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 615112233"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. ahmed@gmail.com"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Country</label>
                <input
                  type="text"
                  value={customerCountry}
                  onChange={(e) => setCustomerCountry(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Passport Image Upload (Mandatory / Qasab) */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <label className="block text-xs font-bold text-amber-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  Sawirka Baasaboorka / Passport Scan (Qasab / Mandatory) *
                </span>
                {passportImage && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sawirka waa la keydiyay
                  </span>
                )}
              </label>

              <input
                ref={passportInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 15 * 1024 * 1024) {
                    setError('Cabbirka sawirka baasaboorku waa inuusan ka badnaan 15MB.');
                    return;
                  }
                  setPassportFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = () => {
                    setPassportImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
              />

              {passportImage ? (
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={passportImage}
                      alt="Passport Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-amber-500/50 shadow-md"
                    />
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{passportFileName || 'passport_document.jpg'}</p>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Diyaar u ah in lagu daro profile-ka & dalabka
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => passportInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
                    >
                      Beddel Sawirka
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPassportImage('');
                        setPassportFileName('');
                      }}
                      className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition cursor-pointer"
                      title="Ka saar sawirka"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => passportInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 sm:p-5 text-center bg-amber-500/5 hover:bg-amber-500/10 transition cursor-pointer group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-300">
                        Taabo halkan si aad u soo upload-gareyso Sawirka Baasaboorka *
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, ama WebP (Sawirka baasaboorku waa qasab dalab kasta)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Service Specific Details Form */}
          <div className="p-5 rounded-2xl bg-[#0C111E] border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Plane className="w-4 h-4" />
              <span>3. Service Specific Requirements ({serviceType})</span>
            </h3>

            {/* FLIGHT TICKET FIELDS */}
            {serviceType === 'Flight Ticket' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Departure City *</label>
                  <input
                    type="text"
                    required
                    value={flightDepCity}
                    onChange={(e) => setFlightDepCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={flightDest}
                    onChange={(e) => setFlightDest(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Trip Type</label>
                  <select
                    value={flightTripType}
                    onChange={(e) => setFlightTripType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="round_trip">Round Trip</option>
                    <option value="one_way">One Way</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={flightDepDate}
                    onChange={(e) => setFlightDepDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                {flightTripType === 'round_trip' && (
                  <div>
                    <label className="block text-slate-300 mb-1">Return Date</label>
                    <input
                      type="date"
                      value={flightRetDate}
                      onChange={(e) => setFlightRetDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-300 mb-1">Cabin Class</label>
                  <select
                    value={flightCabin}
                    onChange={(e) => setFlightCabin(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First Class">First Class</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Preferred Airline</label>
                  <input
                    type="text"
                    value={flightAirline}
                    onChange={(e) => setFlightAirline(e.target.value)}
                    placeholder="e.g. Turkish Airlines, flydubai, Qatar"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 mb-1">Passenger Names & Passport Info</label>
                  <input
                    type="text"
                    value={flightPassengers}
                    onChange={(e) => setFlightPassengers(e.target.value)}
                    placeholder="e.g. Ahmed Hassan Farah (P0876543), Amina Hassan (P0876544)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* VISA SERVICE FIELDS */}
            {serviceType === 'Visa Service' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Destination Country *</label>
                  <input
                    type="text"
                    required
                    value={visaCountry}
                    onChange={(e) => setVisaCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Visa Type *</label>
                  <input
                    type="text"
                    required
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    placeholder="e.g. Tourist 30 Days, Business, Medical"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Applicant Nationality</label>
                  <input
                    type="text"
                    value={visaNationality}
                    onChange={(e) => setVisaNationality(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Intended Travel Date</label>
                  <input
                    type="date"
                    value={visaTravelDate}
                    onChange={(e) => setVisaTravelDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Number of Applicants</label>
                  <input
                    type="number"
                    min={1}
                    value={visaApplicants}
                    onChange={(e) => setVisaApplicants(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-300 mb-1">Required Documents</label>
                  <input
                    type="text"
                    value={visaDocuments}
                    onChange={(e) => setVisaDocuments(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* HOTEL FIELDS */}
            {serviceType === 'Hotel' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Destination City *</label>
                  <input
                    type="text"
                    required
                    value={hotelDest}
                    onChange={(e) => setHotelDest(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Hotel Name / Preference</label>
                  <input
                    type="text"
                    value={hotelPref}
                    onChange={(e) => setHotelPref(e.target.value)}
                    placeholder="e.g. Hilton, Marriott, Fairmont"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Room Type</label>
                  <input
                    type="text"
                    value={hotelRoomType}
                    onChange={(e) => setHotelRoomType(e.target.value)}
                    placeholder="e.g. Deluxe Suite, Standard Twin"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Check-in Date *</label>
                  <input
                    type="date"
                    required
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Check-out Date *</label>
                  <input
                    type="date"
                    required
                    value={hotelCheckOut}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Rooms & Guests</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={hotelRooms}
                      onChange={(e) => setHotelRooms(Number(e.target.value))}
                      className="w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      placeholder="Rooms"
                    />
                    <input
                      type="number"
                      min={1}
                      value={hotelGuests}
                      onChange={(e) => setHotelGuests(Number(e.target.value))}
                      className="w-1/2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      placeholder="Guests"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TRAVEL PACKAGE */}
            {serviceType === 'Travel Package' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Destination & Package Title *</label>
                  <input
                    type="text"
                    required
                    value={pkgDest}
                    onChange={(e) => setPkgDest(e.target.value)}
                    placeholder="e.g. Dubai 7 Days VIP Package"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Travel Dates *</label>
                  <input
                    type="text"
                    required
                    value={pkgDates}
                    onChange={(e) => setPkgDates(e.target.value)}
                    placeholder="e.g. May 15 to May 22, 2026"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Number of Travelers</label>
                  <input
                    type="number"
                    min={1}
                    value={pkgTravelers}
                    onChange={(e) => setPkgTravelers(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-300 mb-1">Activities & Special Requests</label>
                  <input
                    type="text"
                    value={pkgActivities}
                    onChange={(e) => setPkgActivities(e.target.value)}
                    placeholder="e.g. Desert safari, yacht tour, museum passes"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* AIRPORT TRANSFER */}
            {serviceType === 'Airport Transfer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Pickup Location *</label>
                  <input
                    type="text"
                    required
                    value={transPickup}
                    onChange={(e) => setTransPickup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={transDest}
                    onChange={(e) => setTransDest(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Transfer Date & Time *</label>
                  <input
                    type="text"
                    required
                    value={transDatetime}
                    onChange={(e) => setTransDatetime(e.target.value)}
                    placeholder="e.g. 2026-05-10 18:30"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={transVehicle}
                    onChange={(e) => setTransVehicle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* OTHER SERVICE */}
            {serviceType === 'Other' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={otherTitle}
                    onChange={(e) => setOtherTitle(e.target.value)}
                    placeholder="e.g. Travel Insurance, Cargo, Charter"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Detailed Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={otherDesc}
                    onChange={(e) => setOtherDesc(e.target.value)}
                    placeholder="Provide full description of customer travel requirements"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Financial Information & Automatic Debt Rule */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121A2E] to-[#0D1322] border border-amber-500/30 space-y-4">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                4. Financial Information & Payment Setup
              </span>
              <span className="font-mono text-[11px] text-amber-400/80">
                Entered by: @{user?.username}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Total Order Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalPrice}
                    onChange={(e) => handleTotalPriceChange(e.target.value)}
                    placeholder="500.00"
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Amount Paid Now *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Payment Type *</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Paid">Paid / Accepted</option>
                  <option value="Debt">Debt (Pay Later / Installment)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SOS">SOS (Shilling)</option>
                </select>
              </div>
            </div>

            {/* Calculated Debt Notice */}
            {(calculatedDebt > 0 || paymentType === 'Debt') && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Automatic Debt Rule:</strong> This order will automatically receive status{' '}
                    <span className="font-bold underline">Debt</span> and immediately appear in the{' '}
                    <strong>AR Report</strong>.
                  </span>
                </div>
                <div className="text-right font-mono font-bold text-red-400 shrink-0 ml-4">
                  Remaining Debt: ${calculatedDebt.toLocaleString()}
                </div>
              </div>
            )}

            {Number(amountPaid) > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                    <span>Initial Payment Method</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">Kaliya Cash Counter</span>
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-slate-900 border border-amber-500/50 rounded-xl text-white flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Cash Counter (Sanduuqa)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono font-semibold">
                      Fixed (Kaliya)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Payment Reference / Note</label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. Receipt #, Bank wire transaction ref"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Assignment & Internal Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {user?.role === 'super_admin' && (
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Assign Staff Member</label>
                <select
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Leave Unassigned</option>
                  <option value="mohamed">Mohamed (Ticketing & Flights)</option>
                  <option value="sarah">Sarah (Visa Operations)</option>
                  <option value="ali">Ali (Support & Transfers)</option>
                  <option value="admin">Super Admin (Self)</option>
                </select>
              </div>
            )}

            <div className={user?.role === 'super_admin' ? '' : 'sm:col-span-2'}>
              <label className="block text-slate-300 mb-1 font-semibold">Internal Agency Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes visible to staff only"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating Order...' : 'Create Order & Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
