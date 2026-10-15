'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/services/api';

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const PASSWORD_ASCII_REGEX = /^[\x21-\x7E]+$/;
const NAME_REGEX = /^[A-Za-zก-๎\s.'-]+$/;
const PHONE_REGEX = /^0\d{8,9}$/;

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phoneNumber: '',
    });
    const [loading, setLoading] = useState(false);

    // Error ของแต่ละช่อง
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Popup แจ้งเตือน
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'error' | 'success'>('error');
    const [modalMessage, setModalMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return;

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;
        const phoneNumber = formData.phoneNumber.trim();

        // ล้างค่า Error เก่า
        setNameError('');
        setEmailError('');
        setPasswordError('');
        setPhoneError('');

        let hasError = false;

        if (!name) {
            setNameError('กรุณากรอกชื่อ - นามสกุล');
            hasError = true;
        } else if (!NAME_REGEX.test(name)) {
            setNameError('ชื่อใช้ได้เฉพาะตัวอักษรไทย/อังกฤษเท่านั้น');
            hasError = true;
        }

        if (!email) {
            setEmailError('กรุณากรอกอีเมล');
            hasError = true;
        } else if (!EMAIL_REGEX.test(email)) {
            setEmailError('อีเมลต้องเป็นตัวอักษรภาษาอังกฤษ และมีรูปแบบ user@gmail.com');
            hasError = true;
        }

        if (!password) {
            setPasswordError('กรุณากรอกรหัสผ่าน');
            hasError = true;
        } else if (!PASSWORD_ASCII_REGEX.test(password)) {
            setPasswordError('รหัสผ่านใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข และสัญลักษณ์');
            hasError = true;
        } else if (password.length < 8) {
            setPasswordError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
            hasError = true;
        } else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
            setPasswordError('รหัสผ่านต้องมีทั้งตัวพิมพ์ใหญ่ (A-Z) และตัวพิมพ์เล็ก (a-z)');
            hasError = true;
        }

        if (phoneNumber && !PHONE_REGEX.test(phoneNumber)) {
            setPhoneError('เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)');
            hasError = true;
        }

        if (hasError) return;

        setLoading(true);

        // ขั้นที่ 1: สมัครสมาชิก (ถ้าพลาดตรงนี้ = สมัครไม่สำเร็จจริง)
        let user;
        try {
            user = await api.register({ name, email, password, phoneNumber });
        } catch (err) {
            setModalType('error');
            setModalMessage('สมัครสมาชิกไม่สำเร็จ อีเมลอาจถูกใช้แล้ว หรือระบบมีปัญหา กรุณาลองใหม่');
            setShowModal(true);
            setLoading(false); // ให้กดสมัครใหม่ได้
            return;
        }

        // ขั้นที่ 2: เก็บ user ลง localStorage (แยก try เพราะบัญชีถูกสร้างไปแล้ว)
        try {
            localStorage.setItem('user', JSON.stringify(user));
        } catch (err) {
            console.error('บันทึก localStorage ไม่ได้', err);
        }

        setModalType('success');
        setModalMessage('สมัครสมาชิกสำเร็จ!');
        setShowModal(true);
        // ไม่ setLoading(false) ปุ่มจะยังล็อกอยู่ ป้องกันการสมัครซ้ำ
    };

    const handleCloseModal = () => {
        setShowModal(false);
        if (modalType === 'success') {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
            <Navbar />

            <main className="max-w-md mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
                    <div className="text-center space-y-1">
                        <h1 className="text-xl font-bold text-slate-900">สร้างบัญชีใหม่</h1>
                        <p className="text-xs text-slate-500">เริ่มต้นใช้งานระบบจองวัคซีนออนไลน์ VacciCare</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate autoComplete="off">
                        <div>
                            <label htmlFor="name" className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                            <input
                                id="name"
                                type="text"
                                maxLength={100}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-red-500"
                            />
                            {nameError && <p className="text-red-500 text-[11px] mt-1">{nameError}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="block font-bold text-slate-700 mb-1">อีเมล</label>
                            <input
                                id="email"
                                type="text"
                                inputMode="email"
                                maxLength={100}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                autoComplete="off"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-red-500"
                            />
                            {emailError && <p className="text-red-500 text-[11px] mt-1">{emailError}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block font-bold text-slate-700 mb-1">รหัสผ่าน (อย่างน้อย 8 ตัว มี A-Z และ a-z)</label>
                            <input
                                id="password"
                                type="password"
                                maxLength={100}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                autoComplete="new-password"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-red-500"
                            />
                            {passwordError && <p className="text-red-500 text-[11px] mt-1">{passwordError}</p>}
                        </div>

                        <div>
                            <label htmlFor="phone" className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ (ถ้ามี)</label>
                            <input
                                id="phone"
                                type="tel"
                                inputMode="numeric"
                                maxLength={10} // พิมพ์ได้สูงสุด 10 ตัว
                                value={formData.phoneNumber}
                                onChange={(e) =>
                                    // replace(/\D/g, '') = ลบทุกอย่างที่ไม่ใช่ตัวเลขทิ้ง (ตัวอักษร ขีด ช่องว่าง เลขไทย)
                                    setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })
                                }

                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-red-500"
                            />
                            {phoneError && <p className="text-red-500 text-[11px] mt-1">{phoneError}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'กำลังลงทะเบียน...' : 'ยืนยันการสมัครสมาชิก'}
                        </button>
                    </form>

                    <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                        มีบัญชีอยู่แล้ว?{' '}
                        <Link href="/login" className="text-red-600 font-bold hover:underline">
                            เข้าสู่ระบบที่นี่
                        </Link>
                    </div>
                </div>
            </main>

            {/* Modal แจ้งเตือน */}
            {showModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                >
                    <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center space-y-4 border border-slate-200">
                        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto text-2xl font-bold ${modalType === 'error' ? 'border-red-400 text-red-500' : 'border-green-400 text-green-500'
                            }`}>
                            {modalType === 'error' ? '✕' : '✓'}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                            {modalMessage}
                        </h3>
                        <button
                            type="button"
                            autoFocus
                            onClick={handleCloseModal}
                            className={`px-6 py-2 ${modalType === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                } text-white font-bold text-xs rounded-lg transition cursor-pointer`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}