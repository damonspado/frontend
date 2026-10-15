'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Vaccine, Appointment } from '@/types';
import { api } from '@/services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูล (หุ้มด้วย useCallback)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vacData, apptData] = await Promise.all([
        api.getVaccines(),
        api.getAllAppointments(),
      ]);
      setVaccines(vacData);
      setAppointments(apptData);
    } catch (error) {
      console.error('โหลดข้อมูลไม่สำเร็จ', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ตรวจสอบสิทธิ์ Admin และโหลดข้อมูลในรอบเดียวโดยไม่ให้เกิด cascading renders
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      router.push('/login');
      return;
    }

    let isMounted = true;

    const initAdmin = async () => {
      try {
        const userObj: User = JSON.parse(saved);
        if (userObj.status !== 'ADMIN') {
          router.push('/');
          return;
        }

        const [vacData, apptData] = await Promise.all([
          api.getVaccines(),
          api.getAllAppointments(),
        ]);

        if (isMounted) {
          setAdminUser(userObj);
          setVaccines(vacData);
          setAppointments(apptData);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          router.push('/login');
        }
      }
    };

    initAdmin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleDeleteVaccine = async (id: number, name: string) => {
    if (!confirm(`ยืนยันการลบวัคซีน "${name}" ?`)) return;
    try {
      await api.deleteVaccine(id);
      await fetchData();
    } catch {
      alert('ลบข้อมูลไม่สำเร็จ');
    }
  };

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-black">
              V
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-none">VacciCare</h1>
              <span className="text-[10px] font-bold text-red-600 uppercase">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-600 bg-white hover:text-red-600 px-4 py-1.5 rounded-full border border-slate-200 transition cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ระบบจัดการผู้ดูแลระบบ</h2>
            <p className="text-xs text-slate-500 mt-0.5">จัดการข้อมูลแพ็กเกจวัคซีนและตรวจสอบรายการนัดหมายทั้งหมด</p>
          </div>
          <Link
            href="/"
            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            {/* ส่วนที่ 1: ตารางจัดการแพ็กเกจวัคซีน */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm">รายการแพ็กเกจวัคซีน ({vaccines.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">รหัส</th>
                      <th className="px-4 py-3 font-bold">ชื่อวัคซีน</th>
                      <th className="px-4 py-3 font-bold">ราคา (บาท)</th>
                      <th className="px-4 py-3 font-bold text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccines.map((v) => (
                      <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono">#{v.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{v.name}</td>
                        <td className="px-4 py-3">฿{v.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteVaccine(v.id, v.name)}
                            className="text-rose-600 hover:underline font-bold cursor-pointer"
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ส่วนที่ 2: ตารางรายการนัดหมายทั้งหมดในระบบ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm">รายการนัดหมายของสมาชิก ({appointments.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">รหัสคิว</th>
                      <th className="px-4 py-3 font-bold">วัคซีน</th>
                      <th className="px-4 py-3 font-bold">ผู้รับบริการ</th>
                      <th className="px-4 py-3 font-bold">วัน-เวลานัด</th>
                      <th className="px-4 py-3 font-bold text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">
                          ยังไม่มีข้อมูลการนัดหมาย
                        </td>
                      </tr>
                    ) : (
                      appointments.map((appt) => (
                        <tr key={appt.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono">#{appt.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{appt.vaccine?.name}</td>
                          <td className="px-4 py-3">{appt.recipient?.name || '-'}</td>
                          <td className="px-4 py-3">
                            {appt.appointmentDate} ({appt.timeSlot} น.)
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}