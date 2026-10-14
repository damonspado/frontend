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
};

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function BookingStepsContent() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [vaccine, setVaccine] = useState<Vaccine | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const currentBuddhistYear = new Date().getFullYear() + 543;
    const [quantity, setQuantity] = useState(1);
    const [recipients, setRecipients] = useState<DraftRecipient[]>([]);

    const [appointmentDate, setAppointmentDate] = useState<string>('');
    const [timeSlot, setTimeSlot] = useState<string>('09:00');
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        const saved = localStorage.getItem('user');
        if (!saved) {
            router.push('/login');
            return;
        }

        try {
            const userObj = JSON.parse(saved);
            setCurrentUser(userObj);
        } catch (e) {
            router.push('/login');
            return;
        }

        async function fetchVaccine() {
            try {
                setLoading(true);

                setCurrentStep(1);
                setQuantity(1);
                setAppointmentDate('');
                setTimeSlot('09:00');
                setNotes('');
                setSubmitting(false);
                setSubmitError(null);

                const data = await api.getVaccineById(Number(id));
                setVaccine(data);

                const defaultType = (data.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
                setRecipients([{
                    id: Date.now().toString(),
                    name: '',
                    type: defaultType,
                    species: '',
                    birthDay: 1,
                    birthMonth: 1,
                    birthYearBE: currentBuddhistYear - 20
                }]);
            } catch (err: any) {
                setError(err.message || 'ไม่พบข้อมูลวัคซีน');
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchVaccine();
    }, [id, currentBuddhistYear, router]);

    const handleQuantityChange = (newQ: number) => {
        if (newQ < 1) return;
        setQuantity(newQ);

        setRecipients(prev => {
            const defaultType = (vaccine?.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
            if (newQ > prev.length) {
                const addCount = newQ - prev.length;
                const newItems = Array.from({ length: addCount }).map((_, i) => ({
                    id: (Date.now() + i).toString(),
                    name: '',
                    type: defaultType as 'HUMAN' | 'PET',
                    species: '',
                    birthDay: 1,
                    birthMonth: 1,
                    birthYearBE: currentBuddhistYear - 20
                }));
                return [...prev, ...newItems];
            } else if (newQ < prev.length) {
                return prev.slice(0, newQ);
            }
            return prev;
        });
    };

    const updateRecipient = (index: number, field: keyof DraftRecipient, value: any) => {
        const newArr = [...recipients];
        newArr[index] = { ...newArr[index], [field]: value };
        setRecipients(newArr);
    };

    const validateAndGoToStep3 = () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        const hasEmptyName = recipients.some(r => !r.name.trim());
        if (hasEmptyName) {
            setSubmitError('กรุณากรอกชื่อผู้เข้ารับบริการให้ครบทุกคน');
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
        if (!currentUser) return;
        setSubmitError(null);
        try {
            setSubmitting(true);
            for (const draft of recipients) {
                let formattedBirthDate = null;
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
                    notes,
                });
            }
            setCurrentStep(4);
        } catch (err: any) {
            setSubmitError(err.message || 'เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <Navbar />
                <div className="py-20 text-center text-sm text-gray-500">กำลังโหลดข้อมูล...</div>
            </div>
        );
    }

    if (error || !vaccine) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <Navbar />
                <div className="py-20 text-center text-sm text-red-600 font-medium">{error || 'ไม่พบข้อมูลแพ็กเกจ'}</div>
            </div>
        );
    }

    const finalPrice = (vaccine.discountPrice ?? 0) > 0 ? vaccine.discountPrice : vaccine.price;
    const totalPrice = finalPrice * quantity;
    const imageUrl = (vaccine as any).imageUrl || (vaccine as any).image;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* ======================= Stepper ======================= */}
                {currentStep <= 3 && (
                    <div className="flex items-center justify-center mb-10">
                        <div className="flex items-center w-full max-w-xl">
                            <div className="flex flex-col items-center relative z-10 w-1/3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${currentStep >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    1
                                </div>
                                <span className={`text-[11px] font-bold ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>สินค้า</span>
                            </div>
                            <div className={`flex-1 h-[1px] -mx-8 z-0 transition-colors ${currentStep >= 2 ? 'bg-gray-300' : 'bg-gray-200'}`}></div>

                            <div className="flex flex-col items-center relative z-10 w-1/3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${currentStep >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    2
                                </div>
                                <span className={`text-[11px] font-bold ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>ข้อมูลส่วนตัว</span>
                            </div>
                            <div className={`flex-1 h-[1px] -mx-8 z-0 transition-colors ${currentStep >= 3 ? 'bg-gray-300' : 'bg-gray-200'}`}></div>

                            <div className="flex flex-col items-center relative z-10 w-1/3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${currentStep >= 3 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    3
                                </div>
                                <span className={`text-[11px] font-bold ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>สรุปรายละเอียด</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ======================= STEP 1: เลือกสินค้า ======================= */}
                {currentStep === 1 && (
                    <div className="space-y-6">

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">

                            {/* Header ชื่อวัคซีน */}
                            <div className="px-6 py-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-900">{vaccine.name}</h3>
                                <div className="inline-block bg-red-50 px-4 py-1.5 rounded-full text-xs font-bold text-red-600 border border-red-100 whitespace-nowrap">
                                    {(vaccine.category as any)?.categoryName || 'สำหรับบุคคลทั่วไป (คน)'}
                                </div>
                            </div>

                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 lg:gap-10">

                                {/* 🔥 รูปภาพวัคซีน ปรับเป็นแนวนอนนิดๆ aspect-[4/3] เต็มกรอบ */}
                                <div className="w-full md:w-64 lg:w-72 shrink-0">
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white aspect-[4/3] w-full">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={vaccine.name} className="w-full h-full object-cover object-center block" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                                                ไม่มีรูปภาพ
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* รายละเอียดวัคซีน และ ปุ่มบวกลบ */}
                                <div className="flex-1 flex flex-col">

                                    {/* ราคา และ เข็มละ (ปรับฟอนต์ให้เล็กลงและพอดี) */}
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="text-sm font-bold text-gray-800 mt-2">เข็มละ</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-red-600 tracking-tight">
                                                ฿{finalPrice.toLocaleString()}
                                            </span>
                                            {(vaccine.discountPrice ?? 0) > 0 && vaccine.price > vaccine.discountPrice && (
                                                <span className="block text-sm font-medium text-gray-400 line-through mt-1">
                                                    ฿{vaccine.price.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* คำอธิบาย */}
                                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                                        {vaccine.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับวัคซีนนี้'}
                                    </p>

                                    {/* 🔥 ปุ่มเลือกจำนวน (ปรับขนาดฟอนต์และกล่องให้เล็กลง พอดีๆ) */}
                                    <div className="flex justify-between items-center mt-auto pt-6">
                                        <span className="text-sm font-bold text-gray-800">จำนวน</span>
                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9 w-28 shadow-sm">
                                            <button onClick={() => handleQuantityChange(quantity - 1)} className="flex-1 h-full bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold border-r border-gray-200 transition-colors">-</button>
                                            <div className="flex-1 h-full flex items-center justify-center text-sm font-bold text-gray-900 bg-white">{quantity}</div>
                                            <button onClick={() => handleQuantityChange(quantity + 1)} className="flex-1 h-full bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold border-l border-gray-200 transition-colors">+</button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* กล่องรายการสินค้า (สรุปยอดรวม) */}
                        <div className="flex justify-end pt-2 pb-8">
                            <div className="w-full md:w-1/2 lg:w-5/12 space-y-4">
                                <h3 className="font-bold text-gray-900 text-base mb-4">รายการสินค้า</h3>

                                <div className="flex justify-between items-center text-sm text-gray-600 pb-4 border-b border-gray-100">
                                    <span className="truncate pr-4 flex-1">{vaccine.name}</span>
                                    <span className="text-gray-400 w-12 text-center">x{quantity}</span>
                                    <span className="w-20 text-right font-bold text-gray-900">฿{finalPrice.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-bold text-gray-900">ยอดรวมทั้งหมด</span>
                                    <span className="text-2xl font-black text-red-600">฿{totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* ปุ่มกดด้านล่าง */}
                        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                            <button onClick={() => router.push('/')} className="px-8 py-2.5 rounded-full border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
                                ย้อนกลับ
                            </button>
                            <button onClick={() => setCurrentStep(2)} className="px-10 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-sm cursor-pointer">
                                ถัดไป
                            </button>
                        </div>

                    </div>
                )}

                {/* ======================= STEP 2: ข้อมูลส่วนตัว ======================= */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-md">
                                {submitError}
                            </div>
                        )}

                        <div className="space-y-6">
                            {recipients.map((r, index) => (
                                <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <h2 className="font-semibold text-gray-800 text-sm">ข้อมูลผู้เข้ารับบริการ (ลำดับที่ {index + 1})</h2>
                                    </div>

                                    <div className="p-6 space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
                                            <div className="flex gap-3 w-full sm:w-64">
                                                <button type="button" onClick={() => updateRecipient(index, 'type', 'HUMAN')} className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${r.type === 'HUMAN' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>สำหรับคน</button>
                                                <button type="button" onClick={() => updateRecipient(index, 'type', 'PET')} className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${r.type === 'PET' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>สัตว์เลี้ยง</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล {r.type === 'PET' && '(ชื่อสัตว์เลี้ยง)'} <span className="text-red-500">*</span></label>
                                            <input type="text" value={r.name} onChange={(e) => updateRecipient(index, 'name', e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors" />
                                        </div>

                                        {r.type === 'HUMAN' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">วัน/เดือน/ปีเกิด (พ.ศ.) <span className="text-red-500">*</span></label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <select value={r.birthDay} onChange={(e) => updateRecipient(index, 'birthDay', Number(e.target.value))} className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                    <select value={r.birthMonth} onChange={(e) => updateRecipient(index, 'birthMonth', Number(e.target.value))} className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                                                        {THAI_MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
                                                    </select>
                                                    <select value={r.birthYearBE} onChange={(e) => updateRecipient(index, 'birthYearBE', Number(e.target.value))} className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                                                        {Array.from({ length: 100 }, (_, i) => currentBuddhistYear - i).map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {r.type === 'PET' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">สายพันธุ์ / ชนิดสัตว์ <span className="text-red-500">*</span></label>
                                                <input type="text" value={r.species} onChange={(e) => updateRecipient(index, 'species', e.target.value)} placeholder="เช่น ปั๊ก, เปอร์เซีย" className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="font-semibold text-gray-800 text-sm">ข้อมูลการนัดหมาย</h2>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สะดวก <span className="text-red-500">*</span></label>
                                        <input type="date" min={new Date().toISOString().split('T')[0]} value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ช่วงเวลา <span className="text-red-500">*</span></label>
                                        <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500">
                                            <option value="09:00">09:00 น. (ช่วงเช้า)</option>
                                            <option value="10:30">10:30 น. (ช่วงเช้า)</option>
                                            <option value="13:00">13:00 น. (ช่วงบ่าย)</option>
                                            <option value="14:30">14:30 น. (ช่วงบ่าย)</option>
                                            <option value="16:00">16:00 น. (ช่วงเย็น)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุเพิ่มเติม</label>
                                    <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="เช่น มีประวัติแพ้ยา" className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                            <button onClick={() => setCurrentStep(1)} className="px-8 py-2.5 rounded-full border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">
                                ย้อนกลับ
                            </button>
                            <button onClick={validateAndGoToStep3} className="px-10 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-sm">
                                ถัดไป
                            </button>
                        </div>
                    </div>
                )}

                {/* ======================= STEP 3: สรุปรายละเอียด ======================= */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 text-center border-b border-gray-100 pb-4">สรุปรายละเอียดการจอง</h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">แพ็กเกจ</h3>
                                    <p className="font-semibold text-gray-900">{vaccine.name} (x{quantity})</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">วันและเวลา</h3>
                                    <p className="font-medium text-gray-900">{appointmentDate} เวลา {timeSlot} น.</p>
                                    {notes && <p className="text-sm text-gray-600 mt-1">หมายเหตุ: {notes}</p>}
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">ผู้เข้ารับบริการ</h3>
                                    <ul className="space-y-2">
                                        {recipients.map((r, idx) => (
                                            <li key={r.id} className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-900">{idx + 1}. {r.name}</span>
                                                <span className="text-gray-500">{r.type === 'PET' ? 'สัตว์เลี้ยง' : 'คน'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="border-t border-gray-200 pt-4 flex justify-between items-center mt-6">
                                    <span className="font-medium text-gray-900">ยอดชำระสุทธิ</span>
                                    <span className="text-2xl font-bold text-red-600">฿{totalPrice.toLocaleString()}</span>
                                </div>

                                {submitError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md text-center">
                                        {submitError}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 max-w-2xl mx-auto border-t border-gray-200 mt-8">
                            <button onClick={() => setCurrentStep(2)} disabled={submitting} className="px-8 py-2.5 rounded-full border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
                                ย้อนกลับ
                            </button>
                            <button onClick={handleConfirmBooking} disabled={submitting} className="px-10 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-sm disabled:bg-gray-400">
                                {submitting ? 'กำลังบันทึก...' : 'ยืนยันการทำรายการ'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ======================= STEP 4: สำเร็จ ======================= */}
                {currentStep === 4 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 max-w-lg mx-auto text-center mt-10">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">การจองสำเร็จเรียบร้อย</h2>
                        <p className="text-sm text-gray-500 mb-8">
                            ข้อมูลการนัดหมายถูกบันทึกเข้าสู่ระบบแล้ว คุณสามารถตรวจสอบสถานะและรายละเอียดได้ที่หน้ารายการนัดหมาย
                        </p>
                        <button onClick={() => router.push('/my-appointments')} className="px-8 py-2.5 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-colors shadow-sm">
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
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p></div>}>
            <BookingStepsContent />
        </Suspense>
    );
}