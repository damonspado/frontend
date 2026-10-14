// // app/vaccines/[id]/page.tsx
// 'use client';

// import { Suspense, useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Navbar from '@/components/Navbar';
// import { api } from '@/services/api';
// import { Vaccine, User } from '@/types';

// // โครงสร้างข้อมูลชั่วคราวบนหน้าจอ ก่อนบันทึกลง Database
// type DraftRecipient = {
//     id: string;
//     name: string;
//     type: 'HUMAN' | 'PET';
//     species: string;
//     birthDay: number;
//     birthMonth: number;
//     birthYearBE: number;
// };

// const THAI_MONTHS = [
//     'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
//     'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
//     'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
// ];

// function BookingStepsContent() {
//     const params = useParams();
//     const router = useRouter();
//     const id = params?.id as string;

//     const [vaccine, setVaccine] = useState<Vaccine | null>(null);
//     const [currentUser, setCurrentUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [submitting, setSubmitting] = useState(false);

//     // การจัดการสเต็ป (1: สินค้า, 2: ข้อมูลส่วนตัว, 3: สรุปรายละเอียด)
//     const [currentStep, setCurrentStep] = useState(1);

//     // จำนวนคน และ ข้อมูลฟอร์มรายบุคคล
//     const currentBuddhistYear = new Date().getFullYear() + 543;
//     const [quantity, setQuantity] = useState(1);
//     const [recipients, setRecipients] = useState<DraftRecipient[]>([]);

//     // ข้อมูลการนัดหมายรวม
//     const [appointmentDate, setAppointmentDate] = useState<string>('');
//     const [timeSlot, setTimeSlot] = useState<string>('09:00');
//     const [notes, setNotes] = useState<string>('');

//     // 1. ตรวจสอบ User และ ดึงข้อมูลวัคซีน
//     useEffect(() => {
//         const saved = localStorage.getItem('user');
//         if (saved) setCurrentUser(JSON.parse(saved));

//         async function fetchVaccine() {
//             try {
//                 setLoading(true);
//                 const data = await api.getVaccineById(id);
//                 setVaccine(data);

//                 // ตั้งค่าเริ่มต้นของฟอร์มคนแรก ให้ประเภทตรงกับหมวดหมู่วัคซีน
//                 const defaultType = (data.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
//                 setRecipients([{
//                     id: Date.now().toString(),
//                     name: '',
//                     type: defaultType,
//                     species: '',
//                     birthDay: 1,
//                     birthMonth: 1,
//                     birthYearBE: currentBuddhistYear - 20
//                 }]);
//             } catch (err: any) {
//                 setError(err.message || 'ไม่พบข้อมูลวัคซีน');
//             } finally {
//                 setLoading(false);
//             }
//         }
//         if (id) fetchVaccine();
//     }, [id, currentBuddhistYear]);

//     // 2. ฟังก์ชันปรับจำนวน Quantity (ให้ Form เพิ่ม/ลด ตามจำนวน)
//     const handleQuantityChange = (newQ: number) => {
//         if (newQ < 1) return;
//         setQuantity(newQ);

//         setRecipients(prev => {
//             const defaultType = (vaccine?.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
//             if (newQ > prev.length) {
//                 const addCount = newQ - prev.length;
//                 const newItems = Array.from({ length: addCount }).map((_, i) => ({
//                     id: (Date.now() + i).toString(),
//                     name: '',
//                     type: defaultType as 'HUMAN' | 'PET', // 🔴 แก้ไขการบังคับ Type ตรงนี้
//                     species: '',
//                     birthDay: 1,
//                     birthMonth: 1,
//                     birthYearBE: currentBuddhistYear - 20
//                 }));
//                 return [...prev, ...newItems];
//             } else if (newQ < prev.length) {
//                 return prev.slice(0, newQ);
//             }
//             return prev;
//         });
//     };

//     // 3. อัปเดตข้อมูลของแต่ละฟอร์ม
//     const updateRecipient = (index: number, field: keyof DraftRecipient, value: any) => {
//         const newArr = [...recipients];
//         newArr[index] = { ...newArr[index], [field]: value };
//         setRecipients(newArr);
//     };

//     // 4. กดตรวจสอบก่อนไป Step 3
//     const validateAndGoToStep3 = () => {
//         if (!currentUser) {
//             alert('กรุณาเข้าสู่ระบบก่อนทำการจอง');
//             router.push('/login');
//             return;
//         }
//         // เช็คว่ากรอกชื่อครบทุกคนไหม
//         const hasEmptyName = recipients.some(r => !r.name.trim());
//         if (hasEmptyName) {
//             alert('กรุณากรอกชื่อผู้เข้ารับบริการให้ครบทุกคน');
//             return;
//         }
//         if (!appointmentDate) {
//             alert('กรุณาเลือกวันที่ต้องการนัดหมาย');
//             return;
//         }
//         setCurrentStep(3);
//     };

//     // 5. ยืนยันการจอง ส่งข้อมูลลง Backend
//     const handleConfirmBooking = async () => {
//         if (!currentUser) return;
//         try {
//             setSubmitting(true);

//             // วนลูปตามจำนวนคน
//             for (const draft of recipients) {
//                 // จัดฟอร์แมตวันเกิด YYYY-MM-DD
//                 let formattedBirthDate = null;
//                 if (draft.type === 'HUMAN') {
//                     const gregorianYear = draft.birthYearBE - 543;
//                     const mm = String(draft.birthMonth).padStart(2, '0');
//                     const dd = String(draft.birthDay).padStart(2, '0');
//                     formattedBirthDate = `${gregorianYear}-${mm}-${dd}`;
//                 }

//                 // 1. บันทึกประวัติ Recipient
//                 const savedRecipient = await api.addRecipient(currentUser.id, {
//                     name: draft.name,
//                     type: draft.type,
//                     species: draft.type === 'PET' ? draft.species : null,
//                     birthDate: formattedBirthDate,
//                 });

//                 // 2. สร้าง Appointment เชื่อมกับ Recipient ที่เพิ่งบันทึก
//                 await api.createAppointment({
//                     userId: currentUser.id,
//                     vaccineId: Number(id),
//                     recipientId: savedRecipient.id,
//                     appointmentDate,
//                     timeSlot,
//                     notes,
//                 });
//             }

//             alert('จองนัดหมายสำเร็จ!');
//             router.push('/my-appointments');
//         } catch (error: any) {
//             alert(error.message || 'เกิดข้อผิดพลาดในการจอง');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     if (loading) return <div className="min-h-screen bg-slate-50"><Navbar /><div className="py-20 text-center text-sm text-slate-400">กำลังเตรียมตะกร้าสินค้า...</div></div>;
//     if (error || !vaccine) return <div className="min-h-screen bg-slate-50"><Navbar /><div className="py-20 text-center text-sm text-rose-500 font-bold">{error || 'ไม่พบข้อมูล'}</div></div>;

//     const finalPrice = vaccine.discountPrice > 0 ? vaccine.discountPrice : vaccine.price;
//     const totalPrice = finalPrice * quantity;

//     return (
//         <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
//             <Navbar />
//             <main className="max-w-5xl mx-auto px-6 py-8">

//                 {/* =========================================
//             ส่วนที่ 1: Stepper
//         ========================================= */}
//                 <div className="flex items-center justify-center mb-12">
//                     <div className="flex items-center w-full max-w-2xl">
//                         <div className="flex flex-col items-center relative z-10 w-1/3">
//                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-sm ${currentStep >= 1 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>🛒</div>
//                             <span className={`text-[11px] font-bold ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>สินค้า</span>
//                         </div>
//                         <div className={`flex-1 h-0.5 -mx-8 z-0 ${currentStep >= 2 ? 'bg-rose-600' : 'bg-slate-200'}`}></div>
//                         <div className="flex flex-col items-center relative z-10 w-1/3">
//                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-sm ${currentStep >= 2 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>📝</div>
//                             <span className={`text-[11px] font-bold ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>ข้อมูลส่วนตัว</span>
//                         </div>
//                         <div className={`flex-1 h-0.5 -mx-8 z-0 ${currentStep >= 3 ? 'bg-rose-600' : 'bg-slate-200'}`}></div>
//                         <div className="flex flex-col items-center relative z-10 w-1/3">
//                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-sm ${currentStep >= 3 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>📄</div>
//                             <span className={`text-[11px] font-bold ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>สรุปรายละเอียด</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* =========================================
//             STEP 1: ตะกร้าสินค้า
//         ========================================= */}
//                 {currentStep === 1 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
//                         <h1 className="text-xl font-black text-slate-900">ตะกร้าสินค้าของฉัน</h1>
//                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//                             <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
//                                 <h2 className="font-bold text-slate-800 text-sm">{vaccine.name}</h2>
//                             </div>
//                             <div className="p-5 flex flex-col md:flex-row gap-6">
//                                 <div className="w-full md:w-48 h-48 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative shrink-0">
//                                     <img
//                                         src={(vaccine as any).imageUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'} // 🔴 แก้ไขการดึง URL รูปตรงนี้
//                                         alt={vaccine.name}
//                                         className="w-full h-full object-cover"
//                                     />
//                                     <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-teal-700 shadow-sm">
//                                         {(vaccine.category as any)?.categoryName || 'คน'}
//                                     </div>
//                                 </div>
//                                 <div className="flex-1 flex flex-col justify-between">
//                                     <div>
//                                         <div className="flex justify-between items-start mb-2">
//                                             <span className="text-sm font-bold text-slate-700">เข็มละ</span>
//                                             <span className="text-2xl font-black text-rose-600">฿{finalPrice.toLocaleString()}</span>
//                                         </div>
//                                         <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{vaccine.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับวัคซีนนี้'}</p>
//                                     </div>
//                                     <div className="flex justify-between items-end mt-6">
//                                         <span className="text-sm font-bold text-slate-700">จำนวนที่ต้องการ</span>
//                                         <div className="flex items-center border border-slate-200 rounded-md overflow-hidden h-9">
//                                             <button onClick={() => handleQuantityChange(quantity - 1)} className="w-9 h-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold border-r border-slate-200 transition cursor-pointer">-</button>
//                                             <div className="w-12 h-full flex items-center justify-center text-sm font-bold text-slate-800">{quantity}</div>
//                                             <button onClick={() => handleQuantityChange(quantity + 1)} className="w-9 h-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold border-l border-slate-200 transition cursor-pointer">+</button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex justify-end pt-4">
//                             <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
//                                 <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2">รายการสินค้า</h3>
//                                 <div className="flex justify-between text-xs text-slate-600">
//                                     <span className="truncate pr-4">{vaccine.name}</span>
//                                     <span className="whitespace-nowrap">x{quantity}</span>
//                                     <span className="w-16 text-right whitespace-nowrap">฿{(finalPrice * quantity).toLocaleString()}</span>
//                                 </div>
//                                 <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-200">
//                                     <span>ยอดรวมทั้งหมด</span>
//                                     <span className="text-rose-600">฿{totalPrice.toLocaleString()}</span>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-8">
//                             <button onClick={() => router.push('/')} className="px-6 py-2.5 rounded-full border border-rose-600 text-rose-600 font-bold text-sm hover:bg-rose-50 transition cursor-pointer">← กลับหน้าแรก</button>
//                             <button onClick={() => setCurrentStep(2)} className="px-8 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm transition cursor-pointer">ตกลง</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* =========================================
//             STEP 2: ข้อมูลส่วนตัว และ การนัดหมาย
//         ========================================= */}
//                 {currentStep === 2 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
//                         <h1 className="text-xl font-black text-slate-900">กรอกข้อมูลผู้เข้ารับบริการ</h1>

//                         {/* วนลูปสร้าง Form ตามจำนวน Quantity */}
//                         <div className="space-y-4">
//                             {recipients.map((r, index) => (
//                                 <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
//                                     <div className="flex justify-between items-center border-b border-slate-100 pb-3">
//                                         <h2 className="font-bold text-slate-800 text-sm">👤 ผู้เข้ารับบริการคนที่ {index + 1}</h2>
//                                     </div>

//                                     {/* ประเภท (คน / สัตว์) */}
//                                     <div>
//                                         <label className="block text-xs font-bold text-slate-700 mb-2">ประเภท</label>
//                                         <div className="flex gap-2">
//                                             <button onClick={() => updateRecipient(index, 'type', 'HUMAN')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${r.type === 'HUMAN' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>คน</button>
//                                             <button onClick={() => updateRecipient(index, 'type', 'PET')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${r.type === 'PET' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>สัตว์เลี้ยง</button>
//                                         </div>
//                                     </div>

//                                     <div>
//                                         <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ - นามสกุล {r.type === 'PET' && '(ชื่อสัตว์เลี้ยง)'}</label>
//                                         <input type="text" value={r.name} onChange={(e) => updateRecipient(index, 'name', e.target.value)} placeholder="กรอกชื่อ-นามสกุล..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
//                                     </div>

//                                     {r.type === 'HUMAN' && (
//                                         <div>
//                                             <label className="block text-xs font-bold text-slate-700 mb-1">วัน/เดือน/ปีเกิด (พ.ศ.)</label>
//                                             <div className="grid grid-cols-3 gap-2">
//                                                 <select value={r.birthDay} onChange={(e) => updateRecipient(index, 'birthDay', Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none">
//                                                     {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
//                                                 </select>
//                                                 <select value={r.birthMonth} onChange={(e) => updateRecipient(index, 'birthMonth', Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none">
//                                                     {THAI_MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
//                                                 </select>
//                                                 <select value={r.birthYearBE} onChange={(e) => updateRecipient(index, 'birthYearBE', Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none">
//                                                     {Array.from({ length: 100 }, (_, i) => currentBuddhistYear - i).map(y => <option key={y} value={y}>{y}</option>)}
//                                                 </select>
//                                             </div>
//                                         </div>
//                                     )}

//                                     {r.type === 'PET' && (
//                                         <div>
//                                             <label className="block text-xs font-bold text-slate-700 mb-1">สายพันธุ์ / ชนิดสัตว์</label>
//                                             <input type="text" value={r.species} onChange={(e) => updateRecipient(index, 'species', e.target.value)} placeholder="เช่น สุนัขพันธุ์ปั๊ก, แมวเปอร์เซีย" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
//                                         </div>
//                                     )}
//                                 </div>
//                             ))}
//                         </div>

//                         {/* ส่วนเลือกเวลาจอง (ใช้ชุดเดียวสำหรับทุกคนในบิลนี้) */}
//                         <div className="bg-teal-50/50 rounded-xl border border-teal-100 shadow-sm p-6 space-y-4 mt-6">
//                             <h2 className="font-black text-teal-800 text-sm border-b border-teal-200/50 pb-2">📅 กำหนดการนัดหมาย</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-xs font-bold text-slate-700 mb-1">วันที่สะดวก</label>
//                                     <input type="date" min={new Date().toISOString().split('T')[0]} value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500" />
//                                 </div>
//                                 <div>
//                                     <label className="block text-xs font-bold text-slate-700 mb-1">เวลานัดหมาย</label>
//                                     <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500">
//                                         <option value="09:00">09:00 น. (ช่วงเช้า)</option>
//                                         <option value="10:30">10:30 น. (ช่วงเช้า)</option>
//                                         <option value="13:00">13:00 น. (ช่วงบ่าย)</option>
//                                         <option value="14:30">14:30 น. (ช่วงบ่าย)</option>
//                                         <option value="16:00">16:00 น. (ช่วงเย็น)</option>
//                                     </select>
//                                 </div>
//                             </div>
//                             <div>
//                                 <label className="block text-xs font-bold text-slate-700 mb-1">หมายเหตุ (ถ้ามี)</label>
//                                 <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="เช่น มีประวัติแพ้ยา..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500"></textarea>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-8">
//                             <button onClick={() => setCurrentStep(1)} className="px-6 py-2.5 rounded-full border border-rose-600 text-rose-600 font-bold text-sm hover:bg-rose-50 transition cursor-pointer">← ย้อนกลับ</button>
//                             <button onClick={validateAndGoToStep3} className="px-8 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm transition cursor-pointer">ไปหน้าสรุปรายละเอียด →</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* =========================================
//             STEP 3: สรุปรายละเอียด และ กดยืนยัน
//         ========================================= */}
//                 {currentStep === 3 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
//                         <h1 className="text-xl font-black text-slate-900 text-center mb-8">ตรวจสอบความถูกต้อง</h1>

//                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-2xl mx-auto space-y-6">

//                             {/* ข้อมูลแพ็กเกจ */}
//                             <div className="border-b border-dashed border-slate-200 pb-4">
//                                 <p className="text-xs text-slate-400 font-bold mb-1">แพ็กเกจวัคซีนที่เลือก</p>
//                                 <h3 className="text-lg font-black text-slate-800">{vaccine.name}</h3>
//                                 <p className="text-sm text-slate-500 mt-1">จำนวน {quantity} เข็ม</p>
//                             </div>

//                             {/* ข้อมูลนัดหมาย */}
//                             <div className="border-b border-dashed border-slate-200 pb-4">
//                                 <p className="text-xs text-slate-400 font-bold mb-2">วันและเวลานัดหมาย</p>
//                                 <p className="text-sm font-bold text-teal-700">📅 วันที่: {appointmentDate}</p>
//                                 <p className="text-sm font-bold text-teal-700 mt-1">⏰ เวลา: {timeSlot} น.</p>
//                                 {notes && <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded">📝 หมายเหตุ: {notes}</p>}
//                             </div>

//                             {/* ข้อมูลรายชื่อ */}
//                             <div className="border-b border-dashed border-slate-200 pb-4">
//                                 <p className="text-xs text-slate-400 font-bold mb-3">รายชื่อผู้เข้ารับบริการ</p>
//                                 <ul className="space-y-2">
//                                     {recipients.map((r, idx) => (
//                                         <li key={r.id} className="text-sm text-slate-700 flex items-center gap-2">
//                                             <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
//                                             <span className="font-semibold">{r.name}</span>
//                                             <span className="text-[10px] text-slate-400">({r.type === 'PET' ? 'สัตว์เลี้ยง' : 'คน'})</span>
//                                         </li>
//                                     ))}
//                                 </ul>
//                             </div>

//                             {/* ยอดชำระ */}
//                             <div className="pt-2 flex justify-between items-end">
//                                 <span className="font-bold text-slate-800">ยอดชำระสุทธิ</span>
//                                 <span className="text-3xl font-black text-rose-600">฿{totalPrice.toLocaleString()}</span>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-8 max-w-2xl mx-auto">
//                             <button onClick={() => setCurrentStep(2)} disabled={submitting} className="px-6 py-2.5 rounded-full border border-rose-600 text-rose-600 font-bold text-sm hover:bg-rose-50 transition cursor-pointer disabled:opacity-50">← แก้ไขข้อมูล</button>
//                             <button onClick={handleConfirmBooking} disabled={submitting} className="px-8 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:bg-slate-300">
//                                 {submitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการจอง ➔'}
//                             </button>
//                         </div>
//                     </div>
//                 )}

//             </main>
//         </div>
//     );
// }

// export default function VaccineDetailPage() {
//     return (
//         <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
//             <BookingStepsContent />
//         </Suspense>
//     );
// }

// app/vaccines/[id]/page.tsx
// 'use client';
// import { Suspense, useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Navbar from '@/components/Navbar';
// import { api } from '@/services/api';
// import { Vaccine, User } from '@/types';

// // โครงสร้างข้อมูลชั่วคราวบนหน้าจอ ก่อนบันทึกลง Database
// type DraftRecipient = {
//     id: string;
//     name: string;
//     type: 'HUMAN' | 'PET';
//     species: string;
//     birthDay: number;
//     birthMonth: number;
//     birthYearBE: number;
// };

// const THAI_MONTHS = [
//     'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
//     'กรดฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
// ];

// function BookingStepsContent() {
//     const params = useParams();
//     const router = useRouter();
//     const id = params?.id as string;

//     const [vaccine, setVaccine] = useState<Vaccine | null>(null);
//     const [currentUser, setCurrentUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [submitting, setSubmitting] = useState(false);

//     // การจัดการสเต็ป (1: สินค้า, 2: ข้อมูลส่วนตัว, 3: สรุปรายละเอียด)
//     const [currentStep, setCurrentStep] = useState(1);

//     // จำนวนคน และ ข้อมูลฟอร์มรายบุคคล
//     const currentBuddhistYear = new Date().getFullYear() + 543;
//     const [quantity, setQuantity] = useState(1);
//     const [recipients, setRecipients] = useState<DraftRecipient[]>([]);

//     // ข้อมูลการนัดหมายรวม
//     const [appointmentDate, setAppointmentDate] = useState<string>('');
//     const [timeSlot, setTimeSlot] = useState<string>('09:00');
//     const [notes, setNotes] = useState<string>('');

//     // 1. ตรวจสอบ User และ ดึงข้อมูลวัคซีน
//     useEffect(() => {
//         const saved = localStorage.getItem('user');
//         if (saved) setCurrentUser(JSON.parse(saved));

//         async function fetchVaccine() {
//             try {
//                 setLoading(true);
//                 const data = await api.getVaccineById(Number(id));
//                 setVaccine(data);

//                 // ตั้งค่าเริ่มต้นของฟอร์มคนแรก ให้ประเภทตรงกับหมวดหมู่วัคซีน
//                 const defaultType = (data.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
//                 setRecipients([{
//                     id: Date.now().toString(),
//                     name: '',
//                     type: defaultType,
//                     species: '',
//                     birthDay: 1,
//                     birthMonth: 1,
//                     birthYearBE: currentBuddhistYear - 20
//                 }]);
//             } catch (err: any) {
//                 setError(err.message || 'ไม่พบข้อมูลวัคซีน');
//             } finally {
//                 setLoading(false);
//             }
//         }

//         if (id) fetchVaccine();
//     }, [id, currentBuddhistYear]);

//     // 2. ฟังก์ชันปรับจำนวน Quantity (ให้ Form เพิ่ม/ลด ตามจำนวน)
//     const handleQuantityChange = (newQ: number) => {
//         if (newQ < 1) return;
//         setQuantity(newQ);
//         setRecipients(prev => {
//             const defaultType = (vaccine?.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
//             if (newQ > prev.length) {
//                 const addCount = newQ - prev.length;
//                 const newItems = Array.from({ length: addCount }).map((_, i) => ({
//                     id: (Date.now() + i).toString(),
//                     name: '',
//                     type: defaultType as 'HUMAN' | 'PET',
//                     species: '',
//                     birthDay: 1,
//                     birthMonth: 1,
//                     birthYearBE: currentBuddhistYear - 20
//                 }));
//                 return [...prev, ...newItems];
//             } else if (newQ < prev.length) {
//                 return prev.slice(0, newQ);
//             }
//             return prev;
//         });
//     };

//     // 3. อัปเดตข้อมูลของแต่ละฟอร์ม
//     const updateRecipient = (index: number, field: keyof DraftRecipient, value: any) => {
//         const newArr = [...recipients];
//         newArr[index] = { ...newArr[index], [field]: value };
//         setRecipients(newArr);
//     };

//     // 4. กดตรวจสอบก่อนไป Step 3
//     const validateAndGoToStep3 = () => {
//         if (!currentUser) {
//             alert('กรุณาเข้าสู่ระบบก่อนทำการจอง');
//             router.push('/login');
//             return;
//         }

//         const hasEmptyName = recipients.some(r => !r.name.trim());
//         if (hasEmptyName) {
//             alert('กรุณากรอกชื่อผู้เข้ารับบริการให้ครบทุกคน');
//             return;
//         }

//         if (!appointmentDate) {
//             alert('กรุณาเลือกวันที่ต้องการนัดหมาย');
//             return;
//         }

//         setCurrentStep(3);
//     };

//     // 5. ยืนยันการจอง ส่งข้อมูลลง Backend
//     const handleConfirmBooking = async () => {
//         if (!currentUser) return;

//         try {
//             setSubmitting(true);

//             for (const draft of recipients) {
//                 let formattedBirthDate = null;
//                 if (draft.type === 'HUMAN') {
//                     const gregorianYear = draft.birthYearBE - 543;
//                     const mm = String(draft.birthMonth).padStart(2, '0');
//                     const dd = String(draft.birthDay).padStart(2, '0');
//                     formattedBirthDate = `${gregorianYear}-${mm}-${dd}`;
//                 }

//                 const savedRecipient = await api.addRecipient(currentUser.id, {
//                     name: draft.name,
//                     type: draft.type,
//                     species: draft.type === 'PET' ? draft.species : null,
//                     birthDate: formattedBirthDate,
//                 });

//                 await api.createAppointment({
//                     userId: currentUser.id,
//                     vaccineId: Number(id),
//                     recipientId: savedRecipient.id,
//                     appointmentDate,
//                     timeSlot,
//                     notes,
//                 });
//             }

//             alert('จองนัดหมายสำเร็จ!');
//             router.push('/my-appointments');
//         } catch (error: any) {
//             alert(error.message || 'เกิดข้อผิดพลาดในการจอง');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-slate-50">
//                 <Navbar />
//                 <div className="py-20 text-center text-sm text-slate-400">กำลังเตรียมตะกร้าสินค้า...</div>
//             </div>
//         );
//     }

//     if (error || !vaccine) {
//         return (
//             <div className="min-h-screen bg-slate-50">
//                 <Navbar />
//                 <div className="py-20 text-center text-sm text-rose-500 font-bold">{error || 'ไม่พบข้อมูล'}</div>
//             </div>
//         );
//     }

//     const finalPrice = (vaccine.discountPrice ?? 0) > 0 ? vaccine.discountPrice : vaccine.price;
//     const totalPrice = finalPrice * quantity;
//     const imageUrl = (vaccine as any).imageUrl || (vaccine as any).image;

//     return (
//         <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
//             <Navbar />
//             <main className="max-w-5xl mx-auto px-6 py-8">

//                 {/* ========================================= ส่วนที่ 1: Stepper ========================================= */}
//                 <div className="flex items-center justify-center mb-12">
//                     <div className="flex items-center w-full max-w-2xl">
//                         <div className="flex flex-col items-center relative z-10 w-1/3">
//                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-sm ${currentStep >= 1 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>🛒</div>
//                             <span className={`text-[11px] font-bold ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>สินค้า</span>
//                         </div>
//                         <div className={`flex-1 h-0.5 -mx-8 z-0 ${currentStep >= 2 ? 'bg-rose-600' : 'bg-slate-200'}`}></div>
//                         <div className="flex flex-col items-center relative z-10 w-1/3">
//                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-sm ${currentStep >= 2 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>📝</div>
//                             <span className={`text-[11px] font-bold ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>ข้อมูลส่วนตัว</span>
//                         </div>
//                         <div className={`flex-1 h-0.5 -mx-8 z-0 ${currentStep >= 3 ? 'bg-rose-600' : 'bg-slate-200'}`}></div>
//                         <div className="flex flex-col items-center relative z-10 w-1/3">
//                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 shadow-sm ${currentStep >= 3 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'}`}>📄</div>
//                             <span className={`text-[11px] font-bold ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>สรุปรายละเอียด</span>
//                         </div>
//                     </div>
//                 </div>

//                 {/* ========================================= STEP 1: ตะกร้าสินค้า ========================================= */}
//                 {currentStep === 1 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
//                         <h1 className="text-xl font-black text-slate-900 mb-6">ตะกร้าสินค้าของฉัน</h1>

//                         {/* กรอบการ์ดแสดงสินค้า (แยกส่วนสรุปออกมา) */}
//                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
//                             <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
//                                 <h2 className="font-bold text-slate-800 text-base">{vaccine.name}</h2>
//                             </div>
//                             <div className="p-5 md:p-8 flex flex-col md:flex-row gap-8">
//                                 {/* ส่วนรูปภาพ */}
//                                 <div className="w-full md:w-1/3 rounded-2xl border border-slate-200 overflow-hidden relative shrink-0 aspect-[4/3] bg-slate-50 flex items-center justify-center">
//                                     {imageUrl ? (
//                                         <img
//                                             src={imageUrl}
//                                             alt={vaccine.name}
//                                             className="w-full h-full object-contain p-2"
//                                         />
//                                     ) : (
//                                         <span className="text-5xl text-slate-300">💉</span>
//                                     )}
//                                     <div className="absolute top-3 left-3 bg-white/90 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 shadow-sm border border-slate-100">
//                                         {(vaccine.category as any)?.categoryName || 'คน'}
//                                     </div>
//                                 </div>

//                                 {/* ส่วนข้อมูลด้านขวา */}
//                                 <div className="flex-1 flex flex-col justify-between py-2">
//                                     <div>
//                                         <div className="flex justify-between items-start mb-4">
//                                             <span className="text-base font-bold text-slate-800 mt-1">เข็มละ</span>
//                                             <div className="text-right">
//                                                 <span className="text-4xl font-black text-rose-600 tracking-tight">
//                                                     ฿{finalPrice.toLocaleString()}
//                                                 </span>
//                                                 {(vaccine.discountPrice ?? 0) > 0 && vaccine.price > vaccine.discountPrice && (
//                                                     <span className="block text-sm text-slate-400 line-through mt-1">
//                                                         ฿{vaccine.price.toLocaleString()}
//                                                     </span>
//                                                 )}
//                                             </div>
//                                         </div>
//                                         <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mt-2">
//                                             {vaccine.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับวัคซีนนี้'}
//                                         </p>
//                                     </div>

//                                     {/* ส่วนปรับจำนวน */}
//                                     <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100/60">
//                                         <span className="text-base font-bold text-slate-800">จำนวนที่ต้องการ</span>
//                                         <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden h-11 shadow-sm">
//                                             <button onClick={() => handleQuantityChange(quantity - 1)} className="w-12 h-full hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold border-r border-slate-200 transition cursor-pointer">-</button>
//                                             <div className="w-14 h-full flex items-center justify-center text-base font-bold text-slate-900">{quantity}</div>
//                                             <button onClick={() => handleQuantityChange(quantity + 1)} className="w-12 h-full hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold border-l border-slate-200 transition cursor-pointer">+</button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* 🔥 ส่วนสรุปรายการสินค้า (แยกออกมาด้านล่างขวา) 🔥 */}
//                         <div className="flex justify-end pt-2 pb-6">
//                             <div className="w-full md:w-1/2 lg:w-5/12 space-y-5">
//                                 <h3 className="font-bold text-slate-900 text-lg">รายการสินค้า</h3>

//                                 <div className="flex justify-between items-center text-sm text-slate-600 pb-5 border-b border-slate-200">
//                                     <span className="truncate pr-4 flex-1">{vaccine.name}</span>
//                                     <span className="whitespace-nowrap text-slate-500 w-12 text-center">x{quantity}</span>
//                                     <span className="w-20 text-right whitespace-nowrap text-slate-700">฿{(finalPrice * quantity).toLocaleString()}</span>
//                                 </div>

//                                 <div className="flex justify-between items-center text-base font-black text-slate-900 pt-1">
//                                     <span>ยอดรวมทั้งหมด</span>
//                                     <span className="text-rose-600 text-xl">฿{totalPrice.toLocaleString()}</span>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* ส่วนปุ่มกด */}
//                         <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-4">
//                             <button onClick={() => router.push('/')} className="px-8 py-2.5 rounded-full border border-rose-600 text-rose-600 font-bold text-sm hover:bg-rose-50 transition cursor-pointer">
//                                 ← กลับหน้าแรก
//                             </button>
//                             <button onClick={() => setCurrentStep(2)} className="px-12 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition cursor-pointer">
//                                 ตกลง
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* ========================================= STEP 2: ข้อมูลส่วนตัว และ การนัดหมาย ========================================= */}
//                 {currentStep === 2 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
//                         <h1 className="text-xl font-black text-slate-900">กรอกข้อมูลผู้เข้ารับบริการ</h1>

//                         <div className="space-y-4">
//                             {recipients.map((r, index) => (
//                                 <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
//                                     <div className="flex justify-between items-center border-b border-slate-100 pb-3">
//                                         <h2 className="font-bold text-slate-800 text-sm">👤 ผู้เข้ารับบริการคนที่ {index + 1}</h2>
//                                     </div>
//                                     <div>
//                                         <label className="block text-xs font-bold text-slate-700 mb-2">ประเภท</label>
//                                         <div className="flex gap-2">
//                                             <button type="button" onClick={() => updateRecipient(index, 'type', 'HUMAN')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${r.type === 'HUMAN' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>คน</button>
//                                             <button type="button" onClick={() => updateRecipient(index, 'type', 'PET')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${r.type === 'PET' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>สัตว์เลี้ยง</button>
//                                         </div>
//                                     </div>
//                                     <div>
//                                         <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ - นามสกุล {r.type === 'PET' && '(ชื่อสัตว์เลี้ยง)'}</label>
//                                         <input type="text" value={r.name} onChange={(e) => updateRecipient(index, 'name', e.target.value)} placeholder="กรอกชื่อ-นามสกุล..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
//                                     </div>

//                                     {r.type === 'HUMAN' && (
//                                         <div>
//                                             <label className="block text-xs font-bold text-slate-700 mb-1">วัน/เดือน/ปีเกิด (พ.ศ.)</label>
//                                             <div className="grid grid-cols-3 gap-2">
//                                                 <select value={r.birthDay} onChange={(e) => updateRecipient(index, 'birthDay', Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none">
//                                                     {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
//                                                 </select>
//                                                 <select value={r.birthMonth} onChange={(e) => updateRecipient(index, 'birthMonth', Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none">
//                                                     {THAI_MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
//                                                 </select>
//                                                 <select value={r.birthYearBE} onChange={(e) => updateRecipient(index, 'birthYearBE', Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none">
//                                                     {Array.from({ length: 100 }, (_, i) => currentBuddhistYear - i).map(y => <option key={y} value={y}>{y}</option>)}
//                                                 </select>
//                                             </div>
//                                         </div>
//                                     )}

//                                     {r.type === 'PET' && (
//                                         <div>
//                                             <label className="block text-xs font-bold text-slate-700 mb-1">สายพันธุ์ / ชนิดสัตว์</label>
//                                             <input type="text" value={r.species} onChange={(e) => updateRecipient(index, 'species', e.target.value)} placeholder="เช่น สุนัขพันธุ์ปั๊ก, แมวเปอร์เซีย" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500" />
//                                         </div>
//                                     )}
//                                 </div>
//                             ))}
//                         </div>

//                         <div className="bg-teal-50/50 rounded-xl border border-teal-100 shadow-sm p-6 space-y-4 mt-6">
//                             <h2 className="font-black text-teal-800 text-sm border-b border-teal-200/50 pb-2">📅 กำหนดการนัดหมาย</h2>
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div>
//                                     <label className="block text-xs font-bold text-slate-700 mb-1">วันที่สะดวก</label>
//                                     <input type="date" min={new Date().toISOString().split('T')[0]} value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500" />
//                                 </div>
//                                 <div>
//                                     <label className="block text-xs font-bold text-slate-700 mb-1">เวลานัดหมาย</label>
//                                     <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500">
//                                         <option value="09:00">09:00 น. (ช่วงเช้า)</option>
//                                         <option value="10:30">10:30 น. (ช่วงเช้า)</option>
//                                         <option value="13:00">13:00 น. (ช่วงบ่าย)</option>
//                                         <option value="14:30">14:30 น. (ช่วงบ่าย)</option>
//                                         <option value="16:00">16:00 น. (ช่วงเย็น)</option>
//                                     </select>
//                                 </div>
//                             </div>
//                             <div>
//                                 <label className="block text-xs font-bold text-slate-700 mb-1">หมายเหตุ (ถ้ามี)</label>
//                                 <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="เช่น มีประวัติแพ้ยา..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500"></textarea>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-8">
//                             <button onClick={() => setCurrentStep(1)} className="px-8 py-2.5 rounded-full border border-rose-600 text-rose-600 font-bold text-sm hover:bg-rose-50 transition cursor-pointer">← ย้อนกลับ</button>
//                             <button onClick={validateAndGoToStep3} className="px-10 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition cursor-pointer shadow-rose-600/20">ไปหน้าสรุปรายละเอียด →</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* ========================================= STEP 3: สรุปรายละเอียด และ กดยืนยัน ========================================= */}
//                 {currentStep === 3 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
//                         <h1 className="text-xl font-black text-slate-900 text-center mb-8">ตรวจสอบความถูกต้อง</h1>

//                         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-2xl mx-auto space-y-6 relative overflow-hidden">
//                             <div className="absolute top-0 left-0 w-full h-2 bg-rose-600"></div>

//                             <div className="border-b border-dashed border-slate-200 pb-5">
//                                 <p className="text-xs text-slate-400 font-bold mb-1">แพ็กเกจวัคซีนที่เลือก</p>
//                                 <h3 className="text-lg font-black text-slate-800">{vaccine.name}</h3>
//                                 <p className="text-sm font-medium text-slate-500 mt-1">จำนวน {quantity} เข็ม</p>
//                             </div>

//                             <div className="border-b border-dashed border-slate-200 pb-5">
//                                 <p className="text-xs text-slate-400 font-bold mb-2">วันและเวลานัดหมาย</p>
//                                 <div className="bg-teal-50 text-teal-800 p-3 rounded-xl border border-teal-100">
//                                     <p className="text-sm font-bold">📅 วันที่: {appointmentDate}</p>
//                                     <p className="text-sm font-bold mt-1">⏰ เวลา: {timeSlot} น.</p>
//                                 </div>
//                                 {notes && <p className="text-xs text-slate-500 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">📝 หมายเหตุ: {notes}</p>}
//                             </div>

//                             <div className="border-b border-dashed border-slate-200 pb-5">
//                                 <p className="text-xs text-slate-400 font-bold mb-3">รายชื่อผู้เข้ารับบริการ</p>
//                                 <ul className="space-y-3">
//                                     {recipients.map((r, idx) => (
//                                         <li key={r.id} className="text-sm text-slate-700 flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
//                                             <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
//                                             <span className="font-bold text-slate-800">{r.name}</span>
//                                             <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
//                                                 {r.type === 'PET' ? 'สัตว์เลี้ยง' : 'คน'}
//                                             </span>
//                                         </li>
//                                     ))}
//                                 </ul>
//                             </div>

//                             <div className="pt-2 flex justify-between items-end">
//                                 <span className="font-bold text-slate-800">ยอดชำระสุทธิ</span>
//                                 <span className="text-3xl font-black text-rose-600">฿{totalPrice.toLocaleString()}</span>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-8 border-t border-slate-200 mt-8 max-w-2xl mx-auto">
//                             <button onClick={() => setCurrentStep(2)} disabled={submitting} className="px-8 py-2.5 rounded-full border border-rose-600 text-rose-600 font-bold text-sm hover:bg-rose-50 transition cursor-pointer disabled:opacity-50">← แก้ไขข้อมูล</button>
//                             <button onClick={handleConfirmBooking} disabled={submitting} className="px-12 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition cursor-pointer shadow-rose-600/20 disabled:bg-slate-300">
//                                 {submitting ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการจอง ➔'}
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </main>
//         </div>
//     );
// }

// export default function VaccineDetailPage() {
//     return (
//         <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400">Loading...</p></div>}>
//             <BookingStepsContent />
//         </Suspense>
//     );
// }

// app/vaccines/[id]/page.tsx
// app/vaccines/[id]/page.tsx
// 'use client';

// import { Suspense, useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Navbar from '@/components/Navbar';
// import { api } from '@/services/api';
// import { Vaccine, User } from '@/types';

// type DraftRecipient = {
//     id: string;
//     name: string;
//     type: 'HUMAN' | 'PET';
//     species: string;
//     birthDay: number;
//     birthMonth: number;
//     birthYearBE: number;
// };

// const THAI_MONTHS = [
//     'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
//     'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
// ];

// function BookingStepsContent() {
//     const params = useParams();
//     const router = useRouter();
//     const id = params?.id as string;

//     const [vaccine, setVaccine] = useState<Vaccine | null>(null);
//     const [currentUser, setCurrentUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [submitting, setSubmitting] = useState(false);
//     const [submitError, setSubmitError] = useState<string | null>(null);

//     // การจัดการสเต็ป (1: สินค้า, 2: ข้อมูลส่วนตัว, 3: สรุปรายละเอียด, 4: จองสำเร็จ)
//     const [currentStep, setCurrentStep] = useState(1);

//     const currentBuddhistYear = new Date().getFullYear() + 543;
//     const [quantity, setQuantity] = useState(1);
//     const [recipients, setRecipients] = useState<DraftRecipient[]>([]);

//     const [appointmentDate, setAppointmentDate] = useState<string>('');
//     const [timeSlot, setTimeSlot] = useState<string>('09:00');
//     const [notes, setNotes] = useState<string>('');

//     useEffect(() => {
//         const saved = localStorage.getItem('user');
//         if (saved) setCurrentUser(JSON.parse(saved));

//         async function fetchVaccine() {
//             try {
//                 setLoading(true);
//                 const data = await api.getVaccineById(Number(id));
//                 setVaccine(data);

//                 const defaultType = (data.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
//                 setRecipients([{
//                     id: Date.now().toString(),
//                     name: '',
//                     type: defaultType,
//                     species: '',
//                     birthDay: 1,
//                     birthMonth: 1,
//                     birthYearBE: currentBuddhistYear - 20
//                 }]);
//             } catch (err: any) {
//                 setError(err.message || 'ไม่พบข้อมูลวัคซีน');
//             } finally {
//                 setLoading(false);
//             }
//         }

//         if (id) fetchVaccine();
//     }, [id, currentBuddhistYear]);

//     const handleQuantityChange = (newQ: number) => {
//         if (newQ < 1) return;
//         setQuantity(newQ);

//         setRecipients(prev => {
//             const defaultType = (vaccine?.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
//             if (newQ > prev.length) {
//                 const addCount = newQ - prev.length;
//                 const newItems = Array.from({ length: addCount }).map((_, i) => ({
//                     id: (Date.now() + i).toString(),
//                     name: '',
//                     type: defaultType as 'HUMAN' | 'PET',
//                     species: '',
//                     birthDay: 1,
//                     birthMonth: 1,
//                     birthYearBE: currentBuddhistYear - 20
//                 }));
//                 return [...prev, ...newItems];
//             } else if (newQ < prev.length) {
//                 return prev.slice(0, newQ);
//             }
//             return prev;
//         });
//     };

//     const updateRecipient = (index: number, field: keyof DraftRecipient, value: any) => {
//         const newArr = [...recipients];
//         newArr[index] = { ...newArr[index], [field]: value };
//         setRecipients(newArr);
//     };

//     const validateAndGoToStep3 = () => {
//         if (!currentUser) {
//             router.push('/login');
//             return;
//         }

//         const hasEmptyName = recipients.some(r => !r.name.trim());
//         if (hasEmptyName) {
//             setSubmitError('กรุณากรอกชื่อผู้เข้ารับบริการให้ครบทุกคน');
//             return;
//         }

//         if (!appointmentDate) {
//             setSubmitError('กรุณาเลือกวันที่ต้องการนัดหมาย');
//             return;
//         }

//         setSubmitError(null);
//         setCurrentStep(3);
//     };

//     // 🔥 บันทึกข้อมูลโดยไม่ใช้ alert() แล้ว 🔥
//     const handleConfirmBooking = async () => {
//         if (!currentUser) return;
//         setSubmitError(null);
//         try {
//             setSubmitting(true);
//             for (const draft of recipients) {
//                 let formattedBirthDate = null;
//                 if (draft.type === 'HUMAN') {
//                     const gregorianYear = draft.birthYearBE - 543;
//                     const mm = String(draft.birthMonth).padStart(2, '0');
//                     const dd = String(draft.birthDay).padStart(2, '0');
//                     formattedBirthDate = `${gregorianYear}-${mm}-${dd}`;
//                 }

//                 const savedRecipient = await api.addRecipient(currentUser.id, {
//                     name: draft.name,
//                     type: draft.type,
//                     species: draft.type === 'PET' ? draft.species : null,
//                     birthDate: formattedBirthDate,
//                 });

//                 await api.createAppointment({
//                     userId: currentUser.id,
//                     vaccineId: Number(id),
//                     recipientId: savedRecipient.id,
//                     appointmentDate,
//                     timeSlot,
//                     notes,
//                 });
//             }
//             // เปลี่ยนไปหน้า Success ทันที
//             setCurrentStep(4);
//         } catch (err: any) {
//             setSubmitError(err.message || 'เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-slate-50">
//                 <Navbar />
//                 <div className="py-20 text-center text-sm text-slate-400">กำลังเตรียมข้อมูล...</div>
//             </div>
//         );
//     }

//     if (error || !vaccine) {
//         return (
//             <div className="min-h-screen bg-slate-50">
//                 <Navbar />
//                 <div className="py-20 text-center text-sm text-red-500 font-bold">{error || 'ไม่พบข้อมูล'}</div>
//             </div>
//         );
//     }

//     const finalPrice = (vaccine.discountPrice ?? 0) > 0 ? vaccine.discountPrice : vaccine.price;
//     const totalPrice = finalPrice * quantity;
//     const imageUrl = (vaccine as any).imageUrl || (vaccine as any).image;

//     return (
//         <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
//             <Navbar />
//             <main className="max-w-4xl mx-auto px-6 py-8">

//                 {/* ========================================= Stepper (แสดงเฉพาะ Step 1-3) ========================================= */}
//                 {currentStep <= 3 && (
//                     <div className="flex items-center justify-center mb-10">
//                         <div className="flex items-center w-full max-w-2xl">
//                             <div className="flex flex-col items-center relative z-10 w-1/3">
//                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 shadow-sm transition ${currentStep >= 1 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
//                                     {currentStep > 1 ? '✓' : '1'}
//                                 </div>
//                                 <span className={`text-[10px] font-bold ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>สินค้า</span>
//                             </div>
//                             <div className={`flex-1 h-0.5 -mx-8 z-0 transition ${currentStep >= 2 ? 'bg-red-600' : 'bg-slate-200'}`}></div>

//                             <div className="flex flex-col items-center relative z-10 w-1/3">
//                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 shadow-sm transition ${currentStep >= 2 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
//                                     {currentStep > 2 ? '✓' : '2'}
//                                 </div>
//                                 <span className={`text-[10px] font-bold ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>ข้อมูลส่วนตัว</span>
//                             </div>
//                             <div className={`flex-1 h-0.5 -mx-8 z-0 transition ${currentStep >= 3 ? 'bg-red-600' : 'bg-slate-200'}`}></div>

//                             <div className="flex flex-col items-center relative z-10 w-1/3">
//                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 shadow-sm transition ${currentStep >= 3 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
//                                     3
//                                 </div>
//                                 <span className={`text-[10px] font-bold ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>สรุปรายละเอียด</span>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* ========================================= STEP 1: ตะกร้าสินค้า ========================================= */}
//                 {currentStep === 1 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
//                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
//                             <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
//                                 <h2 className="font-bold text-slate-700 text-sm">ข้อมูลแพ็กเกจวัคซีน</h2>
//                             </div>

//                             <div className="p-5 md:p-8 flex flex-col md:flex-row gap-8">
//                                 <div className="w-full md:w-1/3 rounded-xl border border-slate-200 overflow-hidden relative shrink-0 aspect-[4/3] bg-slate-50 flex items-center justify-center">
//                                     {imageUrl ? (
//                                         <img src={imageUrl} alt={vaccine.name} className="w-full h-full object-contain p-2" />
//                                     ) : (
//                                         <div className="text-slate-300 flex flex-col items-center">
//                                             <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
//                                             <span className="text-xs font-medium">ไม่มีรูปภาพ</span>
//                                         </div>
//                                     )}
//                                     <div className="absolute top-3 left-3 bg-white/90 px-3 py-1.5 rounded-md text-[10px] font-bold text-red-700 shadow-sm border border-red-100">
//                                         {(vaccine.category as any)?.categoryName || 'คน'}
//                                     </div>
//                                 </div>

//                                 <div className="flex-1 flex flex-col justify-between py-2">
//                                     <div>
//                                         <h3 className="text-lg font-black text-slate-900 leading-snug mb-4">{vaccine.name}</h3>
//                                         <div className="flex justify-between items-start mb-4">
//                                             <span className="text-sm font-bold text-slate-600 mt-1">เข็มละ</span>
//                                             <div className="text-right">
//                                                 <span className="text-3xl font-black text-red-600 tracking-tight">
//                                                     ฿{finalPrice.toLocaleString()}
//                                                 </span>
//                                                 {(vaccine.discountPrice ?? 0) > 0 && vaccine.price > vaccine.discountPrice && (
//                                                     <span className="block text-xs text-slate-400 line-through mt-0.5">
//                                                         ฿{vaccine.price.toLocaleString()}
//                                                     </span>
//                                                 )}
//                                             </div>
//                                         </div>
//                                         <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line mt-2">
//                                             {vaccine.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับวัคซีนนี้'}
//                                         </p>
//                                     </div>

//                                     <div className="flex justify-between items-center mt-8 pt-5 border-t border-slate-100">
//                                         <span className="text-sm font-bold text-slate-800">จำนวนที่ต้องการ (เข็ม)</span>
//                                         <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden h-10 shadow-sm">
//                                             <button onClick={() => handleQuantityChange(quantity - 1)} className="w-10 h-full hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold border-r border-slate-200 transition cursor-pointer">-</button>
//                                             <div className="w-12 h-full flex items-center justify-center text-sm font-bold text-slate-900">{quantity}</div>
//                                             <button onClick={() => handleQuantityChange(quantity + 1)} className="w-10 h-full hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold border-l border-slate-200 transition cursor-pointer">+</button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex justify-end pt-2 pb-6">
//                             <div className="w-full md:w-1/2 lg:w-5/12 space-y-4">
//                                 <h3 className="font-bold text-slate-900 text-base">รายการสินค้า</h3>
//                                 <div className="flex justify-between items-center text-xs text-slate-600 pb-4 border-b border-slate-200">
//                                     <span className="truncate pr-4 flex-1">{vaccine.name}</span>
//                                     <span className="whitespace-nowrap text-slate-500 w-12 text-center">x{quantity}</span>
//                                     <span className="w-20 text-right whitespace-nowrap font-bold text-slate-700">฿{(finalPrice * quantity).toLocaleString()}</span>
//                                 </div>
//                                 <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
//                                     <span>ยอดรวมทั้งหมด</span>
//                                     <span className="text-red-600 text-xl">฿{totalPrice.toLocaleString()}</span>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-4">
//                             <button onClick={() => router.push('/')} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer">
//                                 ← กลับหน้าแรก
//                             </button>
//                             <button onClick={() => setCurrentStep(2)} className="px-10 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer">
//                                 ถัดไป →
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* ========================================= STEP 2: ข้อมูลส่วนตัว ========================================= */}
//                 {currentStep === 2 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
//                         {submitError && (
//                             <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl text-center mb-4">
//                                 {submitError}
//                             </div>
//                         )}

//                         <div className="space-y-6">
//                             {recipients.map((r, index) => (
//                                 <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//                                     <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
//                                         <h2 className="font-bold text-slate-700 text-sm">ข้อมูลผู้เข้ารับการฉีดวัคซีน (ลำดับที่ {index + 1})</h2>
//                                     </div>

//                                     <div className="p-5 md:p-6 space-y-5">
//                                         <div>
//                                             <label className="block text-xs font-bold text-slate-700 mb-2">ประเภทผู้รับบริการ</label>
//                                             <div className="flex gap-2 w-full md:w-1/2">
//                                                 <button type="button" onClick={() => updateRecipient(index, 'type', 'HUMAN')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${r.type === 'HUMAN' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>คน</button>
//                                                 <button type="button" onClick={() => updateRecipient(index, 'type', 'PET')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${r.type === 'PET' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>สัตว์เลี้ยง</button>
//                                             </div>
//                                         </div>

//                                         <div>
//                                             <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ - นามสกุล {r.type === 'PET' && '(ชื่อสัตว์เลี้ยง)'} *</label>
//                                             <input type="text" value={r.name} onChange={(e) => updateRecipient(index, 'name', e.target.value)} placeholder="กรอกชื่อ-นามสกุล..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-slate-300" />
//                                         </div>

//                                         {r.type === 'HUMAN' && (
//                                             <div>
//                                                 <label className="block text-xs font-bold text-slate-700 mb-1">วัน/เดือน/ปีเกิด (พ.ศ.) *</label>
//                                                 <div className="grid grid-cols-3 gap-3">
//                                                     <select value={r.birthDay} onChange={(e) => updateRecipient(index, 'birthDay', Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
//                                                         {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
//                                                     </select>
//                                                     <select value={r.birthMonth} onChange={(e) => updateRecipient(index, 'birthMonth', Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
//                                                         {THAI_MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
//                                                     </select>
//                                                     <select value={r.birthYearBE} onChange={(e) => updateRecipient(index, 'birthYearBE', Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
//                                                         {Array.from({ length: 100 }, (_, i) => currentBuddhistYear - i).map(y => <option key={y} value={y}>{y}</option>)}
//                                                     </select>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {r.type === 'PET' && (
//                                             <div>
//                                                 <label className="block text-xs font-bold text-slate-700 mb-1">สายพันธุ์ / ชนิดสัตว์ *</label>
//                                                 <input type="text" value={r.species} onChange={(e) => updateRecipient(index, 'species', e.target.value)} placeholder="เช่น สุนัขพันธุ์ปั๊ก, แมวเปอร์เซีย" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-slate-300" />
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
//                             <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
//                                 <h2 className="font-bold text-slate-700 text-sm">เลือกวันเวลาเข้ารับวัคซีน</h2>
//                             </div>
//                             <div className="p-5 md:p-6 space-y-5">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     <div>
//                                         <label className="block text-xs font-bold text-slate-700 mb-1">วันที่สะดวก *</label>
//                                         <input type="date" min={new Date().toISOString().split('T')[0]} value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-slate-600" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-xs font-bold text-slate-700 mb-1">เลือกช่วงเวลาเข้ารับวัคซีน *</label>
//                                         <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-slate-600">
//                                             <option value="09:00">09:00 น. (ช่วงเช้า)</option>
//                                             <option value="10:30">10:30 น. (ช่วงเช้า)</option>
//                                             <option value="13:00">13:00 น. (ช่วงบ่าย)</option>
//                                             <option value="14:30">14:30 น. (ช่วงบ่าย)</option>
//                                             <option value="16:00">16:00 น. (ช่วงเย็น)</option>
//                                         </select>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     <label className="block text-xs font-bold text-slate-700 mb-1">หมายเหตุ (ถ้ามี)</label>
//                                     <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="เช่น มีประวัติแพ้ยา..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-slate-300"></textarea>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-8">
//                             <button onClick={() => setCurrentStep(1)} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer">
//                                 ← ย้อนกลับ
//                             </button>
//                             <button onClick={validateAndGoToStep3} className="px-8 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer">
//                                 ไปหน้าสรุปรายละเอียด →
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* ========================================= STEP 3: สรุปรายละเอียด (มินิมอล/ไม่มีไอคอน) ========================================= */}
//                 {currentStep === 3 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
//                         <div className="text-center mb-6">
//                             <h1 className="text-xl font-black text-slate-900">ตรวจสอบความถูกต้อง</h1>
//                         </div>

//                         <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 max-w-2xl mx-auto space-y-6 relative overflow-hidden shadow-sm">
//                             <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

//                             {/* ส่วนที่ 1: วัคซีนที่เลือก */}
//                             <div className="border-b border-slate-100 pb-5">
//                                 <p className="text-[11px] text-slate-400 font-medium mb-1">แพ็กเกจวัคซีนที่เลือก</p>
//                                 <h3 className="text-sm font-bold text-slate-800">{vaccine.name}</h3>
//                                 <p className="text-[11px] font-bold text-red-600 mt-1">จำนวน {quantity} เข็ม</p>
//                             </div>

//                             {/* ส่วนที่ 2: วันและเวลา */}
//                             <div className="border-b border-slate-100 pb-5">
//                                 <p className="text-[11px] text-slate-400 font-medium mb-3">วันและเวลานัดหมาย</p>
//                                 <div className="space-y-2">
//                                     <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
//                                         <span className="text-xs text-slate-500">วันที่</span>
//                                         <span className="text-xs font-bold text-slate-800">{appointmentDate}</span>
//                                     </div>
//                                     <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
//                                         <span className="text-xs text-slate-500">เวลา</span>
//                                         <span className="text-xs font-bold text-slate-800">{timeSlot} น.</span>
//                                     </div>
//                                 </div>
//                                 {notes && (
//                                     <div className="mt-2 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
//                                         <span className="text-[10px] text-slate-500 block mb-1">หมายเหตุ</span>
//                                         <span className="text-xs font-medium text-slate-700">{notes}</span>
//                                     </div>
//                                 )}
//                             </div>

//                             {/* ส่วนที่ 3: ผู้เข้ารับบริการ */}
//                             <div className="border-b border-slate-100 pb-5">
//                                 <p className="text-[11px] text-slate-400 font-medium mb-3">รายชื่อผู้เข้ารับบริการ</p>
//                                 <div className="space-y-2">
//                                     {recipients.map((r, idx) => (
//                                         <div key={r.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200">
//                                             <div className="flex items-center gap-3">
//                                                 <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
//                                                 <span className="text-xs font-bold text-slate-800">{r.name}</span>
//                                             </div>
//                                             <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
//                                                 {r.type === 'PET' ? 'สัตว์เลี้ยง' : 'คน'}
//                                             </span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             {/* ส่วนที่ 4: ยอดชำระ */}
//                             <div className="pt-2 flex justify-between items-end">
//                                 <span className="text-xs font-bold text-slate-800">ยอดชำระสุทธิ</span>
//                                 <span className="text-xl font-black text-red-600">฿{totalPrice.toLocaleString()}</span>
//                             </div>

//                             {/* แสดงข้อผิดพลาดก่อนกดยืนยัน (ถ้ามี) */}
//                             {submitError && (
//                                 <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-[11px] p-3 rounded-lg text-center">
//                                     {submitError}
//                                 </div>
//                             )}
//                         </div>

//                         <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-8 max-w-2xl mx-auto">
//                             <button onClick={() => setCurrentStep(2)} disabled={submitting} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50">
//                                 ← แก้ไขข้อมูล
//                             </button>
//                             <button onClick={handleConfirmBooking} disabled={submitting} className="px-10 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:bg-slate-300">
//                                 {submitting ? 'กำลังบันทึก...' : 'ยืนยันการจอง →'}
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {/* ========================================= STEP 4: Success State (แทน Alert) ========================================= */}
//                 {currentStep === 4 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 text-center py-16">
//                         <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
//                             <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
//                             </svg>
//                         </div>
//                         <h1 className="text-2xl font-black text-slate-900 tracking-tight">การจองสำเร็จเรียบร้อย</h1>
//                         <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
//                             ข้อมูลการนัดหมายถูกบันทึกเข้าสู่ระบบแล้ว คุณสามารถตรวจสอบสถานะและรายละเอียดได้ที่หน้ารายการนัดหมาย
//                         </p>
//                         <div className="pt-8">
//                             <button onClick={() => router.push('/my-appointments')} className="px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer">
//                                 ดูการนัดหมายของฉัน
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </main>
//         </div>
//     );
// }

// export default function VaccineDetailPage() {
//     return (
//         <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 text-sm">กำลังโหลดข้อมูล...</p></div>}>
//             <BookingStepsContent />
//         </Suspense>
//     );
// }

// app/vaccines/[id]/page.tsx
// 'use client';

// import { Suspense, useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import Navbar from '@/components/Navbar';
// import { api } from '@/services/api';
// import { Vaccine, User } from '@/types';

// type DraftRecipient = {
//     id: string;
//     name: string;
//     type: 'HUMAN' | 'PET';
//     species: string;
//     birthDay: number;
//     birthMonth: number;
//     birthYearBE: number;
// };

// const THAI_MONTHS = [
//     'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
//     'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
// ];

// function BookingStepsContent() {
//     const params = useParams();
//     const router = useRouter();
//     const id = params?.id as string;

//     const [vaccine, setVaccine] = useState<Vaccine | null>(null);
//     const [currentUser, setCurrentUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [submitting, setSubmitting] = useState(false);
//     const [submitError, setSubmitError] = useState<string | null>(null);

//     const [currentStep, setCurrentStep] = useState(1);
//     const currentBuddhistYear = new Date().getFullYear() + 543;
//     const [quantity, setQuantity] = useState(1);
//     const [recipients, setRecipients] = useState<DraftRecipient[]>([]);

//     const [appointmentDate, setAppointmentDate] = useState<string>('');
//     const [timeSlot, setTimeSlot] = useState<string>('09:00');
//     const [notes, setNotes] = useState<string>('');

//     // 🔥 ตรวจสอบการเข้าสู่ระบบทันทีที่เปิดหน้านี้
//     useEffect(() => {
//         const saved = localStorage.getItem('user');
//         if (!saved) {
//             // ถ้ายังไม่ได้ล็อกอิน ให้เด้งไปหน้าเข้าสู่ระบบทันที
//             router.push('/login');
//             return;
//         }

//         try {
//             const userObj = JSON.parse(saved);
//             setCurrentUser(userObj);
//         } catch (e) {
//             router.push('/login');
//             return;
//         }

//         async function fetchVaccine() {
//             try {
//                 setLoading(true);
//                 const data = await api.getVaccineById(Number(id));
//                 setVaccine(data);

//                 const defaultType = (data.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
//                 setRecipients([{
//                     id: Date.now().toString(),
//                     name: '',
//                     type: defaultType,
//                     species: '',
//                     birthDay: 1,
//                     birthMonth: 1,
//                     birthYearBE: currentBuddhistYear - 20
//                 }]);
//             } catch (err: any) {
//                 setError(err.message || 'ไม่พบข้อมูลวัคซีน');
//             } finally {
//                 setLoading(false);
//             }
//         }

//         if (id) fetchVaccine();
//     }, [id, currentBuddhistYear, router]);

//     const handleQuantityChange = (newQ: number) => {
//         if (newQ < 1) return;
//         setQuantity(newQ);

//         setRecipients(prev => {
//             const defaultType = (vaccine?.category as any)?.categoryName === 'สัตว์เลี้ยง' ? 'PET' : 'HUMAN';
//             if (newQ > prev.length) {
//                 const addCount = newQ - prev.length;
//                 const newItems = Array.from({ length: addCount }).map((_, i) => ({
//                     id: (Date.now() + i).toString(),
//                     name: '',
//                     type: defaultType as 'HUMAN' | 'PET',
//                     species: '',
//                     birthDay: 1,
//                     birthMonth: 1,
//                     birthYearBE: currentBuddhistYear - 20
//                 }));
//                 return [...prev, ...newItems];
//             } else if (newQ < prev.length) {
//                 return prev.slice(0, newQ);
//             }
//             return prev;
//         });
//     };

//     const updateRecipient = (index: number, field: keyof DraftRecipient, value: any) => {
//         const newArr = [...recipients];
//         newArr[index] = { ...newArr[index], [field]: value };
//         setRecipients(newArr);
//     };

//     const validateAndGoToStep3 = () => {
//         if (!currentUser) {
//             router.push('/login');
//             return;
//         }

//         const hasEmptyName = recipients.some(r => !r.name.trim());
//         if (hasEmptyName) {
//             setSubmitError('กรุณากรอกชื่อผู้เข้ารับบริการให้ครบทุกคน');
//             return;
//         }

//         if (!appointmentDate) {
//             setSubmitError('กรุณาเลือกวันที่ต้องการนัดหมาย');
//             return;
//         }

//         setSubmitError(null);
//         setCurrentStep(3);
//     };

//     const handleConfirmBooking = async () => {
//         if (!currentUser) return;
//         setSubmitError(null);
//         try {
//             setSubmitting(true);
//             for (const draft of recipients) {
//                 let formattedBirthDate = null;
//                 if (draft.type === 'HUMAN') {
//                     const gregorianYear = draft.birthYearBE - 543;
//                     const mm = String(draft.birthMonth).padStart(2, '0');
//                     const dd = String(draft.birthDay).padStart(2, '0');
//                     formattedBirthDate = `${gregorianYear}-${mm}-${dd}`;
//                 }

//                 const savedRecipient = await api.addRecipient(currentUser.id, {
//                     name: draft.name,
//                     type: draft.type,
//                     species: draft.type === 'PET' ? draft.species : null,
//                     birthDate: formattedBirthDate,
//                 });

//                 await api.createAppointment({
//                     userId: currentUser.id,
//                     vaccineId: Number(id),
//                     recipientId: savedRecipient.id,
//                     appointmentDate,
//                     timeSlot,
//                     notes,
//                 });
//             }
//             setCurrentStep(4);
//         } catch (err: any) {
//             setSubmitError(err.message || 'เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen bg-slate-50">
//                 <Navbar />
//                 <div className="py-20 text-center text-xs text-slate-400">กำลังเตรียมข้อมูล...</div>
//             </div>
//         );
//     }

//     if (error || !vaccine) {
//         return (
//             <div className="min-h-screen bg-slate-50">
//                 <Navbar />
//                 <div className="py-20 text-center text-xs text-red-500 font-bold">{error || 'ไม่พบข้อมูล'}</div>
//             </div>
//         );
//     }

//     const finalPrice = (vaccine.discountPrice ?? 0) > 0 ? vaccine.discountPrice : vaccine.price;
//     const totalPrice = finalPrice * quantity;
//     const imageUrl = (vaccine as any).imageUrl || (vaccine as any).image;

//     return (
//         <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
//             <Navbar />
//             <main className="max-w-4xl mx-auto px-6 py-8">

//                 {currentStep <= 3 && (
//                     <div className="flex items-center justify-center mb-10">
//                         <div className="flex items-center w-full max-w-2xl">
//                             <div className="flex flex-col items-center relative z-10 w-1/3">
//                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 shadow-sm transition ${currentStep >= 1 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
//                                     {currentStep > 1 ? '✓' : '1'}
//                                 </div>
//                                 <span className={`text-[10px] font-bold ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>สินค้า</span>
//                             </div>
//                             <div className={`flex-1 h-0.5 -mx-8 z-0 transition ${currentStep >= 2 ? 'bg-red-600' : 'bg-slate-200'}`}></div>

//                             <div className="flex flex-col items-center relative z-10 w-1/3">
//                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 shadow-sm transition ${currentStep >= 2 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
//                                     {currentStep > 2 ? '✓' : '2'}
//                                 </div>
//                                 <span className={`text-[10px] font-bold ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>ข้อมูลส่วนตัว</span>
//                             </div>
//                             <div className={`flex-1 h-0.5 -mx-8 z-0 transition ${currentStep >= 3 ? 'bg-red-600' : 'bg-slate-200'}`}></div>

//                             <div className="flex flex-col items-center relative z-10 w-1/3">
//                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 shadow-sm transition ${currentStep >= 3 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
//                                     3
//                                 </div>
//                                 <span className={`text-[10px] font-bold ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>สรุปรายละเอียด</span>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {currentStep === 1 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
//                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
//                             <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
//                                 <h2 className="font-bold text-slate-700 text-sm">ข้อมูลแพ็กเกจวัคซีน</h2>
//                             </div>

//                             <div className="p-5 md:p-8 flex flex-col md:flex-row gap-8">
//                                 <div className="w-full md:w-1/3 rounded-xl border border-slate-200 overflow-hidden relative shrink-0 aspect-[4/3] bg-slate-50 flex items-center justify-center">
//                                     {imageUrl ? (
//                                         <img src={imageUrl} alt={vaccine.name} className="w-full h-full object-contain p-2" />
//                                     ) : (
//                                         <div className="text-slate-300 flex flex-col items-center">
//                                             <span className="text-xs font-medium">ไม่มีรูปภาพ</span>
//                                         </div>
//                                     )}
//                                     <div className="absolute top-3 left-3 bg-white/90 px-3 py-1.5 rounded-md text-[10px] font-bold text-red-700 shadow-sm border border-red-100">
//                                         {(vaccine.category as any)?.categoryName || 'คน'}
//                                     </div>
//                                 </div>

//                                 <div className="flex-1 flex flex-col justify-between py-2">
//                                     <div>
//                                         <h3 className="text-lg font-black text-slate-900 leading-snug mb-4">{vaccine.name}</h3>
//                                         <div className="flex justify-between items-start mb-4">
//                                             <span className="text-sm font-bold text-slate-600 mt-1">เข็มละ</span>
//                                             <div className="text-right">
//                                                 <span className="text-3xl font-black text-red-600 tracking-tight">
//                                                     ฿{finalPrice.toLocaleString()}
//                                                 </span>
//                                                 {(vaccine.discountPrice ?? 0) > 0 && vaccine.price > vaccine.discountPrice && (
//                                                     <span className="block text-xs text-slate-400 line-through mt-0.5">
//                                                         ฿{vaccine.price.toLocaleString()}
//                                                     </span>
//                                                 )}
//                                             </div>
//                                         </div>
//                                         <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line mt-2">
//                                             {vaccine.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับวัคซีนนี้'}
//                                         </p>
//                                     </div>

//                                     <div className="flex justify-between items-center mt-8 pt-5 border-t border-slate-100">
//                                         <span className="text-sm font-bold text-slate-800">จำนวนที่ต้องการ (เข็ม)</span>
//                                         <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden h-10 shadow-sm">
//                                             <button onClick={() => handleQuantityChange(quantity - 1)} className="w-10 h-full hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold border-r border-slate-200 transition cursor-pointer">-</button>
//                                             <div className="w-12 h-full flex items-center justify-center text-sm font-bold text-slate-900">{quantity}</div>
//                                             <button onClick={() => handleQuantityChange(quantity + 1)} className="w-10 h-full hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold border-l border-slate-200 transition cursor-pointer">+</button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex justify-end pt-2 pb-6">
//                             <div className="w-full md:w-1/2 lg:w-5/12 space-y-4">
//                                 <h3 className="font-bold text-slate-900 text-base">รายการสินค้า</h3>
//                                 <div className="flex justify-between items-center text-xs text-slate-600 pb-4 border-b border-slate-200">
//                                     <span className="truncate pr-4 flex-1">{vaccine.name}</span>
//                                     <span className="whitespace-nowrap text-slate-500 w-12 text-center">x{quantity}</span>
//                                     <span className="w-20 text-right whitespace-nowrap font-bold text-slate-700">฿{(finalPrice * quantity).toLocaleString()}</span>
//                                 </div>
//                                 <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
//                                     <span>ยอดรวมทั้งหมด</span>
//                                     <span className="text-red-600 text-xl">฿{totalPrice.toLocaleString()}</span>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-4">
//                             <button onClick={() => router.push('/')} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer">
//                                 ย้อนกลับ
//                             </button>
//                             <button onClick={() => setCurrentStep(2)} className="px-10 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer">
//                                 ถัดไป
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {currentStep === 2 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
//                         {submitError && (
//                             <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl text-center mb-4">
//                                 {submitError}
//                             </div>
//                         )}

//                         <div className="space-y-6">
//                             {recipients.map((r, index) => (
//                                 <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//                                     <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
//                                         <h2 className="font-bold text-slate-700 text-sm">ข้อมูลผู้เข้ารับการฉีดวัคซีน (ลำดับที่ {index + 1})</h2>
//                                     </div>

//                                     <div className="p-5 md:p-6 space-y-5">
//                                         <div>
//                                             <label className="block text-xs font-bold text-slate-700 mb-2">ประเภทผู้รับบริการ</label>
//                                             <div className="flex gap-2 w-full md:w-1/2">
//                                                 <button type="button" onClick={() => updateRecipient(index, 'type', 'HUMAN')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${r.type === 'HUMAN' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>คน</button>
//                                                 <button type="button" onClick={() => updateRecipient(index, 'type', 'PET')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${r.type === 'PET' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>สัตว์เลี้ยง</button>
//                                             </div>
//                                         </div>

//                                         <div>
//                                             <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ - นามสกุล {r.type === 'PET' && '(ชื่อสัตว์เลี้ยง)'} *</label>
//                                             <input type="text" value={r.name} onChange={(e) => updateRecipient(index, 'name', e.target.value)} placeholder="กรอกชื่อ-นามสกุล..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-slate-300" />
//                                         </div>

//                                         {r.type === 'HUMAN' && (
//                                             <div>
//                                                 <label className="block text-xs font-bold text-slate-700 mb-1">วัน/เดือน/ปีเกิด (พ.ศ.) *</label>
//                                                 <div className="grid grid-cols-3 gap-3">
//                                                     <select value={r.birthDay} onChange={(e) => updateRecipient(index, 'birthDay', Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
//                                                         {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
//                                                     </select>
//                                                     <select value={r.birthMonth} onChange={(e) => updateRecipient(index, 'birthMonth', Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
//                                                         {THAI_MONTHS.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
//                                                     </select>
//                                                     <select value={r.birthYearBE} onChange={(e) => updateRecipient(index, 'birthYearBE', Number(e.target.value))} className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
//                                                         {Array.from({ length: 100 }, (_, i) => currentBuddhistYear - i).map(y => <option key={y} value={y}>{y}</option>)}
//                                                     </select>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {r.type === 'PET' && (
//                                             <div>
//                                                 <label className="block text-xs font-bold text-slate-700 mb-1">สายพันธุ์ / ชนิดสัตว์ *</label>
//                                                 <input type="text" value={r.species} onChange={(e) => updateRecipient(index, 'species', e.target.value)} placeholder="เช่น สุนัขพันธุ์ปั๊ก, แมวเปอร์เซีย" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-slate-300" />
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
//                             <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
//                                 <h2 className="font-bold text-slate-700 text-sm">เลือกวันเวลาเข้ารับวัคซีน</h2>
//                             </div>
//                             <div className="p-5 md:p-6 space-y-5">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     <div>
//                                         <label className="block text-xs font-bold text-slate-700 mb-1">วันที่สะดวก *</label>
//                                         <input type="date" min={new Date().toISOString().split('T')[0]} value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-slate-600" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-xs font-bold text-slate-700 mb-1">เลือกช่วงเวลาเข้ารับวัคซีน *</label>
//                                         <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition text-slate-600">
//                                             <option value="09:00">09:00 น. (ช่วงเช้า)</option>
//                                             <option value="10:30">10:30 น. (ช่วงเช้า)</option>
//                                             <option value="13:00">13:00 น. (ช่วงบ่าย)</option>
//                                             <option value="14:30">14:30 น. (ช่วงบ่าย)</option>
//                                             <option value="16:00">16:00 น. (ช่วงเย็น)</option>
//                                         </select>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     <label className="block text-xs font-bold text-slate-700 mb-1">หมายเหตุ (ถ้ามี)</label>
//                                     <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="เช่น มีประวัติแพ้ยา..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-slate-300"></textarea>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-8">
//                             <button onClick={() => setCurrentStep(1)} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer">
//                                 ย้อนกลับ
//                             </button>
//                             <button onClick={validateAndGoToStep3} className="px-8 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer">
//                                 ไปหน้าสรุปรายละเอียด
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {currentStep === 3 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
//                         <div className="text-center mb-6">
//                             <h1 className="text-xl font-black text-slate-900">ตรวจสอบความถูกต้อง</h1>
//                         </div>

//                         <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 max-w-2xl mx-auto space-y-6 relative overflow-hidden shadow-sm">
//                             <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

//                             <div className="border-b border-slate-100 pb-5">
//                                 <p className="text-[11px] text-slate-400 font-medium mb-1">แพ็กเกจวัคซีนที่เลือก</p>
//                                 <h3 className="text-sm font-bold text-slate-800">{vaccine.name}</h3>
//                                 <p className="text-[11px] font-bold text-red-600 mt-1">จำนวน {quantity} เข็ม</p>
//                             </div>

//                             <div className="border-b border-slate-100 pb-5">
//                                 <p className="text-[11px] text-slate-400 font-medium mb-3">วันและเวลานัดหมาย</p>
//                                 <div className="space-y-2">
//                                     <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
//                                         <span className="text-xs text-slate-500">วันที่</span>
//                                         <span className="text-xs font-bold text-slate-800">{appointmentDate}</span>
//                                     </div>
//                                     <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
//                                         <span className="text-xs text-slate-500">เวลา</span>
//                                         <span className="text-xs font-bold text-slate-800">{timeSlot} น.</span>
//                                     </div>
//                                 </div>
//                                 {notes && (
//                                     <div className="mt-2 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100">
//                                         <span className="text-[10px] text-slate-500 block mb-1">หมายเหตุ</span>
//                                         <span className="text-xs font-medium text-slate-700">{notes}</span>
//                                     </div>
//                                 )}
//                             </div>

//                             <div className="border-b border-slate-100 pb-5">
//                                 <p className="text-[11px] text-slate-400 font-medium mb-3">รายชื่อผู้เข้ารับบริการ</p>
//                                 <div className="space-y-2">
//                                     {recipients.map((r, idx) => (
//                                         <div key={r.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200">
//                                             <div className="flex items-center gap-3">
//                                                 <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
//                                                 <span className="text-xs font-bold text-slate-800">{r.name}</span>
//                                             </div>
//                                             <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
//                                                 {r.type === 'PET' ? 'สัตว์เลี้ยง' : 'คน'}
//                                             </span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="pt-2 flex justify-between items-end">
//                                 <span className="text-xs font-bold text-slate-800">ยอดชำระสุทธิ</span>
//                                 <span className="text-xl font-black text-red-600">฿{totalPrice.toLocaleString()}</span>
//                             </div>

//                             {submitError && (
//                                 <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-[11px] p-3 rounded-lg text-center">
//                                     {submitError}
//                                 </div>
//                             )}
//                         </div>

//                         <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-8 max-w-2xl mx-auto">
//                             <button onClick={() => setCurrentStep(2)} disabled={submitting} className="px-6 py-2.5 rounded-full border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50">
//                                 ← แก้ไขข้อมูล
//                             </button>
//                             <button onClick={handleConfirmBooking} disabled={submitting} className="px-10 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:bg-slate-300">
//                                 {submitting ? 'กำลังบันทึก...' : 'ยืนยันการจอง →'}
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 {currentStep === 4 && (
//                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 text-center py-16">
//                         <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
//                             <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
//                             </svg>
//                         </div>
//                         <h1 className="text-2xl font-black text-slate-900 tracking-tight">การจองสำเร็จเรียบร้อย</h1>
//                         <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
//                             ข้อมูลการนัดหมายถูกบันทึกเข้าสู่ระบบแล้ว คุณสามารถตรวจสอบสถานะและรายละเอียดได้ที่หน้ารายการนัดหมาย
//                         </p>
//                         <div className="pt-8">
//                             <button onClick={() => router.push('/my-appointments')} className="px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer">
//                                 ดูการนัดหมายของฉัน
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </main>
//         </div>
//     );
// }

// export default function VaccineDetailPage() {
//     return (
//         <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 text-sm">กำลังโหลดข้อมูล...</p></div>}>
//             <BookingStepsContent />
//         </Suspense>
//     );
// }

// app/vaccines/[id]/page.tsx


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