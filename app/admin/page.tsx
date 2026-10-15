'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Vaccine, Appointment } from '@/types';
import { api } from '@/services/api';

type DoctorInfo = {
  id: number;
  name: string;
  email?: string;
  specialty?: string;
  licenseNumber?: string;
  doctorType?: string;
  phoneNumber?: string;
};

type CategoryInfo = {
  id?: string | number;
  categoryId?: string | number;
  name?: string;
  categoryName?: string;
};

type ExtendedVaccine = Vaccine & {
  imageUrl?: string;
  doctor?: DoctorInfo | number | string | null;
};

type ExtendedAppointment = Appointment & {
  doctor?: DoctorInfo | null;
  staffName?: string;
};

type ExtendedApi = typeof api & {
  updateVaccine: (id: number, data: FormData) => Promise<unknown>;
  createVaccine: (data: FormData) => Promise<unknown>;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'vaccines' | 'doctors'>('overview');
  const [adminUser, setAdminUser] = useState<User | null>(null);

  // States ข้อมูล
  const [vaccines, setVaccines] = useState<ExtendedVaccine[]>([]);
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // ================== Modal States (Vaccine) ==================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    discountPrice: 0,
    categoryId: 1,
    doctorId: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // ================== Modal States (Doctor Account) ==================
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editDoctorId, setEditDoctorId] = useState<number | null>(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialty: '',
    licenseNumber: '',
    doctorType: 'HUMAN_DOCTOR',
    phoneNumber: '',
  });

  // ฟังก์ชันดึงข้อมูลทั้งหมด
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vacData, apptData, docData] = await Promise.all([
        api.getVaccines(),
        api.getAllAppointments(),
        fetch('http://localhost:8081/api/doctors')
          .then((res) => res.json())
          .catch(() => []),
      ]);
      setVaccines(vacData as ExtendedVaccine[]);
      setAppointments(apptData as ExtendedAppointment[]);
      setDoctors(Array.isArray(docData) ? (docData as DoctorInfo[]) : []);
    } catch (error) {
      console.error('โหลดข้อมูลไม่สำเร็จ', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ตรวจสอบสิทธิ์ Admin และโหลดข้อมูลในรอบเดียว
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

        const [vacData, apptData, docData] = await Promise.all([
          api.getVaccines(),
          api.getAllAppointments(),
          fetch('http://localhost:8081/api/doctors')
            .then((res) => res.json())
            .catch(() => []),
        ]);

        if (isMounted) {
          setAdminUser(userObj);
          setVaccines(vacData as ExtendedVaccine[]);
          setAppointments(apptData as ExtendedAppointment[]);
          setDoctors(Array.isArray(docData) ? (docData as DoctorInfo[]) : []);
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

  // ================== คำนวณสถิติภาพรวม ==================
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  const validAppointments = appointments.filter((a) => a.status !== 'CANCELLED');
  const humanCount = validAppointments.filter((a) => a.recipient?.type === 'HUMAN').length;
  const petCount = validAppointments.filter((a) => a.recipient?.type === 'PET').length;
  const totalValidCount = humanCount + petCount || 1;
  const humanPercent = Math.round((humanCount / totalValidCount) * 100);
  const petPercent = Math.round((petCount / totalValidCount) * 100);

  const vaccineStats = validAppointments.reduce((acc, curr) => {
    const name = curr.vaccine?.name;
    if (name) acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const popularVaccines = Object.entries(vaccineStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const maxVaccineCount = popularVaccines.length > 0 ? popularVaccines[0][1] : 1;

  // ================== ฟังก์ชันจัดการวัคซีน ==================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({ name: '', description: '', price: 0, discountPrice: 0, categoryId: 1, doctorId: '' });
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (v: ExtendedVaccine) => {
    setEditId(v.id);
    const catObj = (v.category || {}) as CategoryInfo;
    const rawCatId = catObj.categoryId || catObj.id || 1;
    const catId = Number(rawCatId) ? Number(rawCatId) : 1;

    const docObj = v.doctor;
    let docId = '';
    if (docObj && typeof docObj === 'object' && 'id' in docObj) {
      docId = String(docObj.id);
    } else if (typeof docObj === 'number' || typeof docObj === 'string') {
      docId = String(docObj);
    }

    setFormData({
      name: v.name,
      description: v.description || '',
      price: v.price,
      discountPrice: v.discountPrice || 0,
      categoryId: catId,
      doctorId: docId,
    });
    setImageFile(null);
    setImagePreview(v.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleSaveVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const formDataToSend = new FormData();
      const vaccineData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        discountPrice: Number(formData.discountPrice),
        category: { id: String(formData.categoryId), categoryId: String(formData.categoryId) },
        doctor: formData.doctorId ? { id: Number(formData.doctorId) } : null,
      };
      formDataToSend.append('vaccine', new Blob([JSON.stringify(vaccineData)], { type: 'application/json' }));

      if (imageFile) {
        formDataToSend.append('file', imageFile);
      }

      const extendedApi = api as unknown as ExtendedApi;
      if (editId) {
        await extendedApi.updateVaccine(editId, formDataToSend);
      } else {
        await extendedApi.createVaccine(formDataToSend);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      alert('บันทึกข้อมูลไม่สำเร็จ: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVaccine = async (id: number, name: string) => {
    if (!confirm(`ยืนยันการลบวัคซีน "${name}" ?`)) return;
    try {
      await api.deleteVaccine(id);
      await fetchData();
    } catch {
      alert('ลบไม่ได้ อาจมีการจองที่เชื่อมโยงกับวัคซีนนี้อยู่');
    }
  };

  // ================== ฟังก์ชันจัดการแพทย์ (Doctor) ==================
  const openAddDoctorModal = () => {
    setEditDoctorId(null);
    setDoctorFormData({
      name: '',
      email: '',
      password: '',
      specialty: '',
      licenseNumber: '',
      doctorType: 'HUMAN_DOCTOR',
      phoneNumber: '',
    });
    setIsDoctorModalOpen(true);
  };

  const openEditDoctorModal = (doc: DoctorInfo) => {
    setEditDoctorId(doc.id);
    setDoctorFormData({
      name: doc.name || '',
      email: doc.email || '',
      password: '',
      specialty: doc.specialty || '',
      licenseNumber: doc.licenseNumber || '',
      doctorType: doc.doctorType || 'HUMAN_DOCTOR',
      phoneNumber: doc.phoneNumber || '',
    });
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const url = editDoctorId
        ? `http://localhost:8081/api/doctors/${editDoctorId}`
        : 'http://localhost:8081/api/doctors';
      const method = editDoctorId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorFormData),
      });

      if (!res.ok) throw new Error(editDoctorId ? 'แก้ไขข้อมูลแพทย์ไม่สำเร็จ' : 'สร้างบัญชีแพทย์ไม่สำเร็จ');

      alert(editDoctorId ? 'แก้ไขข้อมูลแพทย์สำเร็จเรียบร้อย!' : 'สร้างบัญชีแพทย์สำเร็จเรียบร้อย!');
      setIsDoctorModalOpen(false);
      await fetchData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
      alert('เกิดข้อผิดพลาด: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!adminUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-black">
                V
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-none">VacciCare</h1>
                <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase">
                  Admin Portal
                </span>
              </div>
            </Link>
            <nav className="hidden md:flex gap-6 h-full pt-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`text-sm font-bold h-full px-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                ภาพรวม
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`text-sm font-bold h-full px-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'appointments'
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                จัดการนัดหมาย
              </button>
              <button
                onClick={() => setActiveTab('vaccines')}
                className={`text-sm font-bold h-full px-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'vaccines'
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                วัคซีนและรอบเวลา
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`text-sm font-bold h-full px-2 border-b-2 transition cursor-pointer ${
                  activeTab === 'doctors'
                    ? 'border-red-600 text-red-700'
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                จัดการแพทย์
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-700">{adminUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{adminUser.email}</p>
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
        {loading ? (
          <div className="text-center py-32 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">กำลังซิงค์ข้อมูลระบบ...</p>
          </div>
        ) : (
          <>
            {/* ================= TAB 1: ภาพรวม (Overview) ================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-black text-slate-800">แดชบอร์ดสรุปผล</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      นัดหมายทั้งหมด
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-slate-800">{appointments.length}</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                      รอตรวจสอบ/ชำระเงิน
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-sm">
                    <p className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
                      รอดำเนินการฉีด
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-sky-600">{confirmedCount}</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                      ฉีดเสร็จสมบูรณ์
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-black text-emerald-600">{completedCount}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm mb-6">สัดส่วนผู้รับบริการ</h3>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-xs font-bold text-slate-600">บุคคลทั่วไป</span>
                      </div>
                      <span className="text-lg font-black text-slate-800">{humanPercent || 0}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full mb-6 overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-1000"
                        style={{ width: `${humanPercent || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                        <span className="text-xs font-bold text-slate-600">สัตว์เลี้ยง</span>
                      </div>
                      <span className="text-lg font-black text-slate-800">{petPercent || 0}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full transition-all duration-1000"
                        style={{ width: `${petPercent || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
                    <h3 className="font-bold text-slate-800 text-sm mb-6">วัคซีนที่มีการจองสูงสุด</h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      {popularVaccines.length === 0 ? (
                        <p className="text-center text-xs text-slate-400">ยังไม่มีข้อมูลการจอง</p>
                      ) : (
                        popularVaccines.map(([name, count], idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-1/3 truncate text-xs font-bold text-slate-600">{name}</div>
                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden flex items-center">
                              <div
                                className="h-full bg-red-500 rounded-full transition-all duration-1000"
                                style={{ width: `${(count / maxVaccineCount) * 100}%` }}
                              ></div>
                            </div>
                            <div className="w-8 text-right text-xs font-black text-slate-800">{count}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: จัดการนัดหมาย ================= */}
            {activeTab === 'appointments' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-slate-800">รายการนัดหมายทั้งหมด</h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    รวม {appointments.length} รายการ
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-bold">รหัสคิว</th>
                        <th className="px-5 py-4 font-bold">วัคซีน</th>
                        <th className="px-5 py-4 font-bold">ผู้รับบริการ</th>
                        <th className="px-5 py-4 font-bold">วัน-เวลา</th>
                        <th className="px-5 py-4 font-bold text-center">สถานะปัจจุบัน</th>
                        <th className="px-5 py-4 font-bold text-center">แพทย์รับผิดชอบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">
                            ไม่มีข้อมูลนัดหมาย
                          </td>
                        </tr>
                      ) : (
                        appointments.map((appt) => {
                          const isPet = appt.recipient?.type === 'PET';
                          const doctorName = appt.doctor?.name || appt.staffName;

                          return (
                            <tr key={appt.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                              <td className="px-5 py-4 font-mono text-slate-400 font-bold">
                                {appt.appointmentCode || `#${appt.id}`}
                              </td>
                              <td className="px-5 py-4 font-bold text-slate-800">{appt.vaccine?.name}</td>
                              <td className="px-5 py-4">
                                <div className="font-bold text-slate-700">{appt.recipient?.name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  ประเภท: {isPet ? 'สัตว์เลี้ยง' : 'บุคคลทั่วไป'}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                <div className="font-medium text-slate-700">{appt.appointmentDate}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">เวลา {appt.timeSlot} น.</div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                                    appt.status === 'COMPLETED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : appt.status === 'CANCELLED'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : appt.status === 'CONFIRMED'
                                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {appt.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center font-medium">
                                {doctorName ? (
                                  <span className="text-slate-700 font-bold">{doctorName}</span>
                                ) : appt.status === 'COMPLETED' ? (
                                  <span className="text-slate-500 font-medium text-[10px]">
                                    ไม่ได้บันทึกชื่อแพทย์
                                  </span>
                                ) : appt.status === 'CANCELLED' ? (
                                  <span className="text-slate-300">-</span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">รอแพทย์รับคิว</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= TAB 3: จัดการวัคซีน ================= */}
            {activeTab === 'vaccines' && (
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">ฐานข้อมูลวัคซีน</h2>
                    <p className="text-sm text-slate-500 mt-1">จัดการแพ็กเกจวัคซีนและราคาในระบบ</p>
                  </div>
                  <button
                    onClick={openAddModal}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-full transition cursor-pointer"
                  >
                    + เพิ่มวัคซีนใหม่
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vaccines.map((v) => {
                    const docName =
                      v.doctor && typeof v.doctor === 'object' && 'name' in v.doctor ? v.doctor.name : 'ไม่ระบุ';

                    return (
                      <div
                        key={v.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 flex justify-between items-center shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center">
                            {v.imageUrl ? (
                              <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">ไม่มีรูป</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">ราคา: ฿{v.price.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              แพทย์ประจำ: {docName}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(v)}
                            className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteVaccine(v.id, v.name)}
                            className="px-4 py-1.5 border border-rose-200 text-rose-600 rounded-full text-xs font-bold hover:bg-rose-50 transition cursor-pointer"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= TAB 4: จัดการแพทย์ (Doctor Accounts) ================= */}
            {activeTab === 'doctors' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">รายชื่อแพทย์ในระบบ</h2>
                    <p className="text-sm text-slate-500 mt-1">จัดการบัญชีสำหรับการเข้าสู่ระบบของคุณหมอ</p>
                  </div>
                  <button
                    onClick={openAddDoctorModal}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-full transition cursor-pointer"
                  >
                    + สร้างบัญชีแพทย์ใหม่
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-slate-800 text-base">{doc.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 text-slate-600 rounded border border-slate-200">
                            {doc.doctorType === 'VET' ? 'สัตวแพทย์' : 'แพทย์ทั่วไป'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-500">
                            อีเมล: <span className="font-mono text-slate-700">{doc.email || 'ยังไม่ได้ตั้งค่า'}</span>
                          </p>
                          <p className="text-xs text-slate-500">ความเชี่ยวชาญ: {doc.specialty || '-'}</p>
                          <p className="text-xs text-slate-500">ใบอนุญาต: {doc.licenseNumber || '-'}</p>
                          <p className="text-xs text-slate-500">เบอร์โทร: {doc.phoneNumber || '-'}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => openEditDoctorModal(doc)}
                          className="px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold text-xs rounded-full transition cursor-pointer"
                        >
                          แก้ไขข้อมูล
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= Modal สร้าง/แก้ไข Account Doctor ================= */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="font-black text-slate-800 text-lg">
                {editDoctorId ? 'แก้ไขข้อมูลแพทย์' : 'สร้างบัญชีแพทย์ใหม่'}
              </h2>
              <button
                onClick={() => setIsDoctorModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveDoctor} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                <input
                  required
                  type="text"
                  value={doctorFormData.name}
                  onChange={(e) => setDoctorFormData({ ...doctorFormData, name: e.target.value })}
                  placeholder="นพ. สมชาย ใจดี"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">อีเมลสำหรับเข้าสู่ระบบ</label>
                <input
                  required
                  type="email"
                  disabled={!!editDoctorId}
                  value={doctorFormData.email}
                  onChange={(e) => setDoctorFormData({ ...doctorFormData, email: e.target.value })}
                  placeholder="doctor@vacci.com"
                  className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none ${
                    editDoctorId
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      : 'bg-white focus:border-red-500'
                  }`}
                />
              </div>
              {!editDoctorId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน</label>
                  <input
                    required
                    type="password"
                    value={doctorFormData.password}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทแพทย์</label>
                  <select
                    value={doctorFormData.doctorType}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, doctorType: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="HUMAN_DOCTOR">แพทย์ทั่วไป (คน)</option>
                    <option value="VET">สัตวแพทย์ (สัตว์)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลขใบอนุญาต</label>
                  <input
                    type="text"
                    value={doctorFormData.licenseNumber}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, licenseNumber: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ความเชี่ยวชาญ</label>
                <input
                  type="text"
                  value={doctorFormData.specialty}
                  onChange={(e) => setDoctorFormData({ ...doctorFormData, specialty: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={doctorFormData.phoneNumber}
                  onChange={(e) => setDoctorFormData({ ...doctorFormData, phoneNumber: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  {isSaving ? 'กำลังบันทึก...' : editDoctorId ? 'บันทึกการแก้ไข' : 'สร้างบัญชีแพทย์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Modal เพิ่ม/แก้ไขวัคซีน ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="font-black text-slate-800 text-lg">
                {editId ? 'แก้ไขข้อมูลวัคซีน' : 'เพิ่มแพ็กเกจวัคซีนใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveVaccine} className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-3">
                  รูปภาพหน้าปกวัคซีน (ถ้ามี)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">ไม่มีรูป</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer transition"
                    />
                    <p className="text-[10px] text-slate-500 mt-2">รองรับไฟล์ JPG, PNG ขนาดสูงสุด 2MB</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อแพ็กเกจวัคซีน</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รายละเอียด</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ราคาปกติ (บาท)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ราคาโปรโมชั่น (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่เป้าหมาย</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value={1}>สำหรับบุคคลทั่วไป (คน)</option>
                  <option value={2}>สำหรับสัตว์เลี้ยง</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  แพทย์ / สัตวแพทย์ ประจำแพ็กเกจ (ถ้ามี)
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 cursor-pointer text-slate-700"
                >
                  <option value="">-- ไม่ระบุแพทย์ประจำ --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.doctorType === 'VET' ? 'สัตวแพทย์' : 'แพทย์ทั่วไป'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}