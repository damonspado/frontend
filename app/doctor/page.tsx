'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Appointment } from '@/types';
import { api } from '@/services/api';

type ExtendedDoctor = User & {
  doctorType?: string;
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctorUser, setDoctorUser] = useState<ExtendedDoctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAllAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('โหลดข้อมูลนัดหมายไม่สำเร็จ', error);
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

    const initDoctor = async () => {
      try {
        const userObj: ExtendedDoctor = JSON.parse(saved);
        if (userObj.status !== 'DOCTOR' && userObj.status !== 'ADMIN' && !userObj.doctorType) {
          router.push('/');
          return;
        }
        const data = await api.getAllAppointments();
        if (isMounted) {
          setDoctorUser(userObj);
          setAppointments(data);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          router.push('/login');
        }
      }
    };

    initDoctor();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleCompleteVaccination = async (appointmentId: number) => {
    if (!confirm('ยืนยันว่าผู้รับบริการได้รับวัคซีนเรียบร้อยแล้วใช่ไหม?')) return;

    try {
      await api.updateAppointmentStatus(appointmentId, {
        status: 'COMPLETED',
        staffName: doctorUser?.name || 'แพทย์ผู้เวร',
      });
      alert('อัปเดตสถานะการฉีดวัคซีนสำเร็จ!');
      await fetchAppointments();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      alert('อัปเดตสถานะไม่สำเร็จ: ' + msg);
    }
  };

  if (!doctorUser) return null;

  const myAppointments = appointments.filter((appt) => {
    const type = doctorUser.doctorType || 'HUMAN_DOCTOR';
    const recipientType = appt.recipient?.type;
    if (type === 'VET') {
      return recipientType === 'PET';
    } else {
      return recipientType === 'HUMAN';
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-black">
              V
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-none">VacciCare</h1>
              <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase">
                Doctor Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-700">{doctorUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{doctorUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 bg-white hover:text-red-600 px-4 py-1.5 rounded-full border border-slate-200 hover:border-red-200 transition cursor-pointer"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              รายการคิวรับผิดชอบของคุณหมอ
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              แสดงเฉพาะรายการคิวฉีดวัคซีนที่ตรงกับแผนกของคุณหมอ
            </p>
          </div>
          <button
            onClick={fetchAppointments}
            className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-full hover:bg-slate-50 transition cursor-pointer"
          >
            รีเฟรชข้อมูลคิว
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-sm text-slate-400">กำลังโหลดข้อมูลคิว...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-bold">รหัสคิว</th>
                    <th className="px-6 py-4 font-bold">วัคซีน</th>
                    <th className="px-6 py-4 font-bold">ผู้รับบริการ</th>
                    <th className="px-6 py-4 font-bold">วัน-เวลา นัดหมาย</th>
                    <th className="px-6 py-4 font-bold text-center">สถานะปัจจุบัน</th>
                    <th className="px-6 py-4 font-bold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {myAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        ไม่มีคิวนัดหมายของแผนกคุณหมอในขณะนี้
                      </td>
                    </tr>
                  ) : (
                    myAppointments.map((appt) => (
                      <tr key={appt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-mono font-bold text-slate-400">
                          {appt.appointmentCode || `#${appt.id}`}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{appt.vaccine?.name}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">{appt.recipient?.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ประเภท: {appt.recipient?.type === 'PET' ? 'สัตว์เลี้ยง' : 'บุคคลทั่วไป'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700">{appt.appointmentDate}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">เวลา {appt.timeSlot} น.</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {appt.status === 'PENDING' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[10px]">
                              รอตรวจสอบ
                            </span>
                          )}
                          {appt.status === 'CONFIRMED' && (
                            <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold text-[10px]">
                              ยืนยันคิวแล้ว
                            </span>
                          )}
                          {appt.status === 'COMPLETED' && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px]">
                              ฉีดสำเร็จแล้ว
                            </span>
                          )}
                          {appt.status === 'CANCELLED' && (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold text-[10px]">
                              ยกเลิก
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' ? (
                            <button
                              onClick={() => handleCompleteVaccination(appt.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-[11px] shadow-sm transition cursor-pointer"
                            >
                              ยืนยันฉีดวัคซีนแล้ว
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">เสร็จสิ้นภารกิจ</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}