'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('กรุณากรอกอีเมล');
      hasError = true;
    }
    if (!password) {
      setPasswordError('กรุณากรอกรหัสผ่าน');
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      let loggedInUser: Record<string, unknown> | null = null;
      try {
        const res = await api.login({ email, password });
        loggedInUser = res as unknown as Record<string, unknown>;
      } catch {
        try {
          const docRes = await api.loginDoctor({ email, password });
          loggedInUser = docRes as unknown as Record<string, unknown>;
        } catch {
          throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
      }

      localStorage.setItem('user', JSON.stringify(loggedInUser));

      if (loggedInUser?.status === 'ADMIN') {
        router.push('/admin');
      } else if (loggedInUser?.status === 'DOCTOR' || loggedInUser?.doctorType) {
        router.push('/doctor');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      setErrorMessage('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <Navbar />
      <main className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-slate-900">เข้าสู่ระบบ</h1>
            <p className="text-xs text-slate-500">ยินดีต้อนรับกลับสู่ระบบ VacciCare</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate autoComplete="off">
            <div>
              <label className="block font-bold text-slate-700 mb-1">อีเมล</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-red-500"
              />
              {emailError && <p className="text-red-500 text-[11px] mt-1">{emailError}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-red-500"
              />
              {passwordError && <p className="text-red-500 text-[11px] mt-1">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition cursor-pointer text-xs"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            ยังไม่มีบัญชีผู้ใช้?{' '}
            <Link href="/register" className="text-red-600 font-bold hover:underline">
              สมัครสมาชิกที่นี่
            </Link>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 text-center space-y-4 border border-slate-200">
            <div className="w-16 h-16 rounded-full border-2 border-red-400 flex items-center justify-center mx-auto text-red-500 text-2xl font-bold">
              ✕
            </div>
            <h3 className="text-sm font-bold text-slate-800">{errorMessage}</h3>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}