'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/services/api';
import { Vaccine, User } from '@/types';

type DraftRecipient = {
  id: string;
  name: string;
  type: 'HUMAN' | 'PET';
  species: string;
  birthDay: number;
  birthMonth: number;
  birthYearBE: number;
  notes: string;
};

type CategoryInfo = {
  id?: string | number;
  categoryId?: string | number;
  name?: string;
  categoryName?: string;
};

type ExtendedVaccine = Vaccine & {
  imageUrl?: string;
  image?: string;
  category?: CategoryInfo;
};

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function BookingStepsContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [vaccine, setVaccine] = useState<ExtendedVaccine | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const currentBuddhistYear = new Date().getFullYear() + 543;
  
  const [recipients, setRecipients] = useState<DraftRecipient[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('09:00');

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }

    let isMounted = true;

    const initBookingPage = async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentStep(1);
        setAppointmentDate('');
        setTimeSlot('09:00');
        setSubmitting(false);
        setSubmitError(null);

        const userObj: User = JSON.parse(saved);
        if (!isMounted) return;
        setCurrentUser(userObj);

        if (id) {
          const data = await api.getVaccineById(Number(id));
          if (!isMounted) return;
          setVaccine(data as ExtendedVaccine);

          const catObj = (data.category || {}) as CategoryInfo;
          const catIdStr = String(catObj.categoryId || catObj.id || '').trim();
          const catNameStr = String(catObj.categoryName || catObj.name || '').toLowerCase();
          const isPetVaccine = catIdStr === '2' || catNameStr.includes('สัตว์') || catNameStr.includes('pet');

          const defaultType = isPetVaccine ? 'PET' : 'HUMAN';

          setRecipients([{
            id: Date.now().toString(),
            name: '',
            type: defaultType,
            species: '',
            birthDay: 1,
            birthMonth: 1,
            birthYearBE: currentBuddhistYear - 20,
            notes: ''
          }]);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'ไม่พบข้อมูลแพ็กเกจ';
        setError(msg);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initBookingPage();

    return () => {
      isMounted = false;
    };
  }, [id, currentBuddhistYear, router]);

  const handleAddRecipient = () => {
    const catObj = (vaccine?.category || {}) as CategoryInfo;
    const catIdStr = String(catObj.categoryId || catObj.id || '').trim();
    const catNameStr = String(catObj.categoryName || catObj.name || '').toLowerCase();
    const isPetVaccine = catIdStr === '2' || catNameStr.includes('สัตว์') || catNameStr.includes('pet');
    const defaultType = isPetVaccine ? 'PET' : 'HUMAN';

    setRecipients(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        type: defaultType,
        species: '',
        birthDay: 1,
        birthMonth: 1,
        birthYearBE: currentBuddhistYear - 20,
        notes: ''
      }
    ]);
  };

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length === 1) {
      setSubmitError('ต้องมีผู้เข้ารับบริการอย่างน้อย 1 รายการ');
      return;
    }
    setSubmitError(null);
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const updateRecipientField = (index: number, field: keyof DraftRecipient, value: unknown) => {
    const newArr = [...recipients];
    newArr[index] = { ...newArr[index], [field]: value };
    setRecipients(newArr);
  };

  const validateAndGoToStep3 = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    const hasEmpty = recipients.some(r => !r.name.trim());
    if (hasEmpty) {
      setSubmitError('กรุณากรอกชื่อผู้เข้ารับบริการให้ครบทุกรายการ');
      return;
    }
    if (!appointmentDate) {
      setSubmitError('กรุณาเลือกวันที่ต้องการนัดหมาย');
      return;
    }
    setSubmitError(null);
    setCurrentStep(3);
  };

  const handleConfirmBooking = async () => {
    if (!currentUser || !vaccine) return;
    setSubmitError(null);
    try {
      setSubmitting(true);
      
      for (const draft of recipients) {
        let formattedBirthDate: string | null = null;
        if (draft.type === 'HUMAN') {
          const gregorianYear = draft.birthYearBE - 543;
          const mm = String(draft.birthMonth).padStart(2, '0');
          const dd = String(draft.birthDay).padStart(2, '0');
          formattedBirthDate = `${gregorianYear}-${mm}-${dd}`;
        }

        const savedRecipient = await api.addRecipient(currentUser.id, {
          name: draft.name,
          type: draft.type,
          species: draft.type === 'PET' ? draft.species : null,
          birthDate: formattedBirthDate,
        });

        await api.createAppointment({
          userId: currentUser.id,
          vaccineId: Number(id),
          recipientId: savedRecipient.id,
          appointmentDate,
          timeSlot,
          notes: draft.notes,
        });
      }

      setCurrentStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="py-20 text-center text-xs text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error || !vaccine) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="py-20 text-center text-xs text-red-600 font-medium">{error || 'ไม่พบข้อมูลแพ็กเกจ'}</div>
      </div>
    );
  }

  const finalPrice = (vaccine.discountPrice ?? 0) > 0 ? vaccine.discountPrice : vaccine.price;
  const totalPrice = finalPrice * recipients.length;
  const imageUrl = vaccine.imageUrl || vaccine.image;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 text-xs sm:text-sm">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Stepper */}
        {currentStep <= 3 && (
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center w-full max-w-xl">
              <div className="flex flex-col items-center relative z-10 w-1/3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-colors ${currentStep >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                <span className={`text-[11px] font-medium ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>สินค้า</span>
              </div>
              <div className={`flex-1 h-[1px] -mx-8 z-0 transition-colors ${currentStep >= 2 ? 'bg-gray-300' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center relative z-10 w-1/3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-colors ${currentStep >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                <span className={`text-[11px] font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>ข้อมูลส่วนตัว</span>
              </div>
              <div className={`flex-1 h-[1px] -mx-8 z-0 transition-colors ${currentStep >= 3 ? 'bg-gray-300' : 'bg-gray-200'}`}></div>
              <div className="flex flex-col items-center relative z-10 w-1/3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-colors ${currentStep >= 3 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                <span className={`text-[11px] font-medium ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>สรุปรายละเอียด</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: เลือกสินค้า */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{vaccine.name}</h3>
                <div className="inline-block bg-red-50 px-3 py-1 rounded-full text-xs font-medium text-red-600 border border-red-100 whitespace-nowrap">
                  {vaccine.category?.categoryName || vaccine.category?.name || 'สำหรับบุคคลทั่วไป'}
                </div>
              </div>

              <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-56 lg:w-64 shrink-0">
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white aspect-[4/3] w-full">
                    {imageUrl ? (
                      <img src={imageUrl} alt={vaccine.name} className="w-full h-full object-cover object-center block" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-50">ไม่มีรูปภาพ</div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-medium text-gray-700 mt-1">ราคาต่อเข็ม</span>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-bold text-red-600 tracking-tight">฿{finalPrice.toLocaleString()}</span>
                      {(vaccine.discountPrice ?? 0) > 0 && vaccine.price > vaccine.discountPrice && (
                        <span className="block text-xs font-normal text-gray-400 line-through mt-0.5">฿{vaccine.price.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                    {vaccine.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับวัคซีนนี้'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 pb-6">
              <div className="w-full md:w-1/2 lg:w-6/12 space-y-3">
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-3">สรุปคำสั่งซื้อ</h3>
                <div className="flex justify-between items-center text-xs text-gray-600 pb-3 border-b border-gray-100 gap-4">
                  <span className="truncate flex-1">{vaccine.name}</span>
                  <span className="text-gray-400 shrink-0 whitespace-nowrap">1 แพ็กเกจ</span>
                  <span className="w-20 text-right font-medium text-gray-900 shrink-0">฿{finalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">ยอดชำระเบื้องต้น</span>
                  <span className="text-xl sm:text-2xl font-bold text-red-600">฿{finalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button onClick={() => router.push('/')} className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">ย้อนกลับ</button>
              <button onClick={() => setCurrentStep(2)} className="px-8 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer">ถัดไป</button>
            </div>
          </div>
        )}

        {/* STEP 2: ข้อมูลส่วนตัวและหมายเหตุแยกแต่ละตัว */}
        {currentStep === 2 && (
          <div className="space-y-5">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-md">
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-gray-900 text-xs sm:text-sm">รายชื่อผู้เข้ารับบริการ (สามารถเพิ่มหลายคน/หลายตัวได้)</h2>
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors border border-red-200 cursor-pointer"
                >
                  + เพิ่ม{recipients[0]?.type === 'PET' ? 'สัตว์เลี้ยง' : 'บุคคล'}
                </button>
              </div>

              {recipients.map((r, index) => (
                <div key={r.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800 text-xs">รายการที่ {index + 1}</h3>
                    {recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer"
                      >
                        ลบรายการนี้
                      </button>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ประเภท</label>
                      <div className="w-full sm:w-56 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-xs font-normal text-gray-700">
                        {r.type === 'PET' ? 'สำหรับสัตว์เลี้ยง' : 'สำหรับบุคคลทั่วไป'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        ชื่อ-นามสกุล {r.type === 'PET' && '(ชื่อสัตว์เลี้ยง)'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => updateRecipientField(index, 'name', e.target.value)}
                        placeholder={r.type === 'PET' ? 'ระบุชื่อสัตว์เลี้ยง เช่น เจ้าทอง' : 'ระบุชื่อ-นามสกุล'}
                        className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                      />
                    </div>

                    {r.type === 'HUMAN' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          วัน/เดือน/ปีเกิด (พ.ศ.) <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <select value={r.birthDay} onChange={(e) => updateRecipientField(index, 'birthDay', Number(e.target.value))} className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <select value={r.birthMonth} onChange={(e) => updateRecipientField(index, 'birthMonth', Number(e.target.value))} className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500">
                            {THAI_MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                          </select>
                          <select value={r.birthYearBE} onChange={(e) => updateRecipientField(index, 'birthYearBE', Number(e.target.value))} className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500">
                            {Array.from({ length: 100 }, (_, i) => currentBuddhistYear - i).map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {r.type === 'PET' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          สายพันธุ์ / ชนิดสัตว์ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={r.species}
                          onChange={(e) => updateRecipientField(index, 'species', e.target.value)}
                          placeholder="เช่น ชิสุ, ปั๊ก, เปอร์เซีย"
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">หมายเหตุ / อาการแพ้เฉพาะตัว</label>
                      <input
                        type="text"
                        value={r.notes}
                        onChange={(e) => updateRecipientField(index, 'notes', e.target.value)}
                        placeholder="เช่น มีประวัติแพ้ยา, ท้องอยู่"
                        className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <h2 className="font-medium text-gray-800 text-xs">ข้อมูลวันเวลานัดหมาย (ใช้ร่วมกัน)</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">วันที่สะดวก <span className="text-red-500">*</span></label>
                    <input type="date" min={new Date().toISOString().split('T')[0]} value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">ช่วงเวลา <span className="text-red-500">*</span></label>
                    <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500">
                      <option value="09:00">09:00 น. (ช่วงเช้า)</option>
                      <option value="10:30">10:30 น. (ช่วงเช้า)</option>
                      <option value="13:00">13:00 น. (ช่วงบ่าย)</option>
                      <option value="14:30">14:30 น. (ช่วงบ่าย)</option>
                      <option value="16:00">16:00 น. (ช่วงเย็น)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button onClick={() => setCurrentStep(1)} className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-50 transition-colors shadow-sm">ย้อนกลับ</button>
              <button onClick={validateAndGoToStep3} className="px-8 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors shadow-sm">ถัดไป</button>
            </div>
          </div>
        )}

        {/* STEP 3: สรุปรายละเอียด */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-xl mx-auto">
              <h2 className="text-sm font-bold text-gray-900 mb-5 text-center border-b border-gray-100 pb-3">สรุปรายละเอียดการจอง</h2>
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-medium text-gray-500 mb-1">แพ็กเกจวัคซีน</h3>
                  <p className="font-semibold text-gray-900">{vaccine.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500 mb-1">วันและเวลาที่นัดหมาย</h3>
                  <p className="font-medium text-gray-900">{appointmentDate} เวลา {timeSlot} น.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500 mb-2">ผู้เข้ารับบริการ ({recipients.length} รายการ)</h3>
                  <div className="space-y-2">
                    {recipients.map((r, idx) => (
                      <div key={r.id} className="bg-gray-50 p-3 rounded-md border border-gray-100 space-y-1">
                        <div className="flex items-center justify-between font-medium text-gray-900">
                          <span>{idx + 1}. {r.name} {r.species ? `(${r.species})` : ''}</span>
                          <span className="text-gray-500 font-normal">{r.type === 'PET' ? 'สัตว์เลี้ยง' : 'บุคคลทั่วไป'}</span>
                        </div>
                        {r.notes && (
                          <p className="text-gray-600 text-[11px] pt-1 border-t border-gray-200/60">
                            หมายเหตุ: {r.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-4">
                  <span className="font-bold text-gray-900">ยอดชำระสุทธิ ({recipients.length} เข็ม)</span>
                  <span className="text-xl font-bold text-red-600">฿{totalPrice.toLocaleString()}</span>
                </div>
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-center">
                    {submitError}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 max-w-xl mx-auto border-t border-gray-200 mt-6">
              <button onClick={() => setCurrentStep(2)} disabled={submitting} className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">ย้อนกลับ</button>
              <button onClick={handleConfirmBooking} disabled={submitting} className="px-8 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors shadow-sm disabled:bg-gray-400">
                {submitting ? 'กำลังบันทึก...' : 'ยืนยันการทำรายการ'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: สำเร็จ */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md mx-auto text-center mt-10">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">การจองสำเร็จเรียบร้อย</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              บันทึกการนัดหมายและหมายเหตุเฉพาะตัวเรียบร้อยแล้ว คุณสามารถตรวจสอบสถานะได้ที่หน้ารายการนัดหมาย
            </p>
            <button onClick={() => router.push('/my-appointments')} className="px-6 py-2 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs transition-colors shadow-sm">
              ดูการนัดหมายของฉัน
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default function VaccineDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-xs">กำลังโหลดข้อมูล...</p></div>}>
      <BookingStepsContent />
    </Suspense>
  );
}