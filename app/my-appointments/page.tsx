'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/services/api';
import { User, Appointment } from '@/types';

export default function MyAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const loadAppointments = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const myAppts = await api.getUserAppointments(id);
      setAppointments(myAppts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }

    let isMounted = true;

    const initData = async () => {
      try {
        const userObj: User = JSON.parse(saved);
        const myAppts = await api.getUserAppointments(userObj.id);
        if (isMounted) {
          setUserId(userObj.id);
          setAppointments(myAppts);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          router.push('/login');
        }
      }
    };

    initData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCancel = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการนัดหมายนี้?')) return;
    try {
      await api.cancelAppointment(id);
      alert('ยกเลิกการนัดหมายเรียบร้อยแล้ว');
      if (userId) {
        await loadAppointments(userId);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถยกเลิกการนัดหมายได้';
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    }
  };

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 text-xs sm:text-sm">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">การนัดหมายของฉัน</h1>
            <p className="text-xs text-slate-500 mt-0.5">รายการนัดหมายฉีดวัคซีนทั้งหมดที่จองผ่านระบบ VacciCare</p>
          </div>
          <Link
            href="/"
            className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3.5 py-1.5 rounded-full transition cursor-pointer"
          >
            + จองวัคซีนเพิ่ม
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : appointments.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <p className="text-slate-500 font-medium text-xs">คุณยังไม่มีรายการนัดหมายในขณะนี้</p>
            <Link href="/" className="inline-block mt-3 text-red-600 font-bold text-xs hover:underline">
              ดูแพ็กเกจวัคซีนของเรา
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => {
              const price = appt.vaccine?.price || 0;
              const discountPrice = appt.vaccine?.discountPrice;
              const finalPrice = discountPrice && discountPrice > 0 ? discountPrice : price;
              const isPet = appt.recipient?.type === 'PET';

              return (
                <div key={appt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5 relative">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        รหัสการจอง: {appt.appointmentCode || `APT-${appt.id}`}
                      </span>
                      <h2 className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">{appt.vaccine?.name}</h2>
                    </div>
                    <div>
                      {appt.status === 'PENDING' && (
                        <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[11px] font-medium px-2.5 py-1 rounded-full">
                          รอดำเนินการ
                        </span>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <span className="bg-sky-50 text-sky-600 border border-sky-200 text-[11px] font-medium px-2.5 py-1 rounded-full">
                          ยืนยันแล้ว
                        </span>
                      )}
                      {appt.status === 'COMPLETED' && (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-medium px-2.5 py-1 rounded-full">
                          ฉีดสำเร็จแล้ว
                        </span>
                      )}
                      {appt.status === 'CANCELLED' && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-medium px-2.5 py-1 rounded-full">
                          ยกเลิกแล้ว
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">ผู้รับการฉีด</p>
                      <p className="text-xs font-bold text-slate-700">
                        {appt.recipient?.name}{' '}
                        <span className="font-normal text-slate-500">({isPet ? 'สัตว์เลี้ยง' : 'บุคคลทั่วไป'})</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">วันและเวลานัดหมาย</p>
                      <p className="text-xs font-bold text-slate-700">
                        {appt.appointmentDate} <span className="font-normal text-slate-500">เวลา {appt.timeSlot} น.</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-medium mb-0.5">ยอดชำระ</p>
                      <p className="text-xs font-bold text-red-600">฿{finalPrice.toLocaleString()} บาท</p>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-lg flex items-start gap-2 mb-3">
                    <p className="text-[11px] text-slate-600 font-medium">
                      หมายเหตุ: <span className="font-normal text-slate-500">{appt.notes || '-'}</span>
                    </p>
                  </div>

                  {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleCancel(appt.id)}
                        className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:underline transition cursor-pointer"
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