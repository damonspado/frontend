'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/services/api';
import { User, Appointment } from '@/types';

export default function MyAppointmentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('user');
        if (!saved) {
            router.push('/login');
            return;
        }
        const userObj = JSON.parse(saved);
        setUser(userObj);
        loadAppointments(userObj.id);
    }, [router]);

    const loadAppointments = async (userId: number) => {
        try {
            setLoading(true);
            //  เรียก API ดึงเฉพาะคิวของ User คนนี้โดยตรงจาก Backend (ปลอดภัย ไม่เห็นข้อมูลคนอื่น)
            const myAppts = await api.getUserAppointments(userId);
            setAppointments(myAppts);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการนัดหมายนี้?')) return;
        try {
            //  เรียกใช้ฟังก์ชัน cancelAppointment โดยตรง
            await api.cancelAppointment(id);
            alert('ยกเลิกการนัดหมายเรียบร้อยแล้ว');
            if (user) loadAppointments(user.id);
        } catch (err: any) {
            alert('เกิดข้อผิดพลาด: ' + err.message);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">การนัดหมายของฉัน</h1>
                        <p className="text-sm text-slate-500 mt-1">รายการนัดหมายฉีดวัคซีนทั้งหมดที่จองผ่านระบบ VacciCare</p>
                    </div>
                    <Link
                        href="/"
                        className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition"
                    >
                        + จองวัคซีนเพิ่ม
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-sm text-slate-400">กำลังโหลดข้อมูล...</div>
                ) : appointments.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
                        <p className="text-4xl mb-4">💉</p>
                        <p className="text-slate-500 font-medium">คุณยังไม่มีรายการนัดหมายในขณะนี้</p>
                        <Link href="/" className="inline-block mt-4 text-red-600 font-bold text-sm hover:underline">
                            ดูแพ็กเกจวัคซีนของเรา
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {appointments.map((appt) => {
                            const price = appt.vaccine?.price || 0;
                            const discountPrice = appt.vaccine?.discountPrice;
                            const finalPrice = discountPrice && discountPrice > 0 ? discountPrice : price;
                            const isPet = appt.recipient?.type === 'PET';

                            return (
                                <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                รหัสการจอง: {appt.appointmentCode || `APT-${appt.id}`}
                                            </span>
                                            <h2 className="text-lg font-black text-slate-800 mt-1">{appt.vaccine?.name}</h2>
                                        </div>
                                        <div>
                                            {appt.status === 'PENDING' && <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full">รอดำเนินการ (Pending)</span>}
                                            {appt.status === 'CONFIRMED' && <span className="bg-sky-50 text-sky-600 border border-sky-200 text-xs font-bold px-3 py-1.5 rounded-full">ยืนยันแล้ว (Confirmed)</span>}
                                            {appt.status === 'COMPLETED' && <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full">ฉีดสำเร็จแล้ว ✅</span>}
                                            {appt.status === 'CANCELLED' && <span className="bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-full">ยกเลิกแล้ว (Cancelled)</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-slate-50 p-4 rounded-xl">
                                            <p className="text-[10px] text-slate-400 font-bold mb-1">ผู้รับการฉีด</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {appt.recipient?.name} <span className="font-normal text-slate-500">{isPet ? '(สัตว์เลี้ยง 🐾)' : '👤 (คน)'}</span>
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl">
                                            <p className="text-[10px] text-slate-400 font-bold mb-1">วันและเวลานัดหมาย</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {appt.appointmentDate} <span className="font-normal text-slate-500">เวลา {appt.timeSlot} น.</span>
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl">
                                            <p className="text-[10px] text-slate-400 font-bold mb-1">ยอดชำระ</p>
                                            <p className="text-sm font-black text-red-600">฿{finalPrice.toLocaleString()} บาท</p>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-lg flex items-start gap-2 mb-4">
                                        <span className="text-sm">📝</span>
                                        <p className="text-xs text-slate-600 font-medium">
                                            หมายเหตุ: <span className="font-normal text-slate-500">{appt.notes || '-'}</span>
                                        </p>
                                    </div>

                                    {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={() => handleCancel(appt.id)}
                                                className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline transition cursor-pointer"
                                            >
                                                ยกเลิกนัดหมาย
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}