// // components/Navbar.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { useRouter, usePathname } from 'next/navigation';
// import { User } from '@/types';

// export default function Navbar() {
//     const router = useRouter();
//     const pathname = usePathname();
//     const [user, setUser] = useState<User | null>(null);

//     useEffect(() => {
//         const saved = localStorage.getItem('user');
//         if (saved) {
//             try {
//                 setUser(JSON.parse(saved));
//             } catch (e) {
//                 // Ignore error
//             }
//         }
//     }, [pathname]); // รีเฟรชข้อมูลเมื่อเปลี่ยนหน้า

//     const handleLogout = () => {
//         localStorage.removeItem('user');
//         setUser(null);
//         router.push('/login');
//     };

//     return (
//         <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
//             <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

//                 {/* ================= Logo Section (ปรับให้เหมือนหน้า Admin) ================= */}
//                 <Link href="/" className="flex items-center gap-3">
//                     <div className="w-10 h-10 bg-[#e60000] rounded-full flex items-center justify-center text-white text-[18px] font-black">
//                         V
//                     </div>
//                     <div className="flex flex-col justify-center">
//                         <h1 className="text-[17px] font-black text-[#001f3f] leading-none tracking-tight">
//                             VacciCare
//                         </h1>
//                         <span className="text-[10px] font-black text-[#e60000] tracking-widest uppercase mt-0.5">
//                             Vaccination Portal
//                         </span>
//                     </div>
//                 </Link>

//                 {/* ================= Navigation Links ================= */}
//                 <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
//                     <Link href="/" className={`transition ${pathname === '/' ? 'text-red-600' : 'hover:text-red-600'}`}>
//                         หน้าแรก
//                     </Link>

//                     {/* เมนูการนัดหมายของฉัน (แสดงเฉพาะ User ทั่วไป) */}
//                     {(!user || user.status === 'USER') && (
//                         <Link href="/my-appointments" className={`transition ${pathname === '/my-appointments' ? 'text-red-600' : 'hover:text-red-600'}`}>
//                             การนัดหมายของฉัน
//                         </Link>
//                     )}

//                     {/* เมนูพิเศษสำหรับ Admin หรือ Doctor ให้กดกลับไปหน้าจัดการได้ง่ายๆ */}
//                     {user?.status === 'ADMIN' && (
//                         <Link href="/admin" className="text-sky-600 hover:text-sky-700 transition">
//                             หน้าจัดการ (Admin)
//                         </Link>
//                     )}

//                     {(user?.status === 'DOCTOR' || (user as any)?.doctorType) && (
//                         <Link href="/doctor" className="text-sky-600 hover:text-sky-700 transition">
//                             หน้าจัดการคิว (Doctor)
//                         </Link>
//                     )}
//                 </nav>

//                 {/* ================= Auth Section ================= */}
//                 <div className="flex items-center gap-4">
//                     {user ? (
//                         <div className="flex items-center gap-4">
//                             <div className="text-right hidden sm:block">
//                                 <p className="text-xs font-bold text-slate-700">{user.name}</p>
//                                 <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{user.status || 'USER'}</p>
//                             </div>
//                             <button
//                                 onClick={handleLogout}
//                                 className="text-xs font-bold text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-full border border-slate-200 hover:border-red-200 transition cursor-pointer"
//                             >
//                                 ออกจากระบบ
//                             </button>
//                         </div>
//                     ) : (
//                         <div className="flex items-center gap-3">
//                             <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-red-600 transition px-2">
//                                 เข้าสู่ระบบ
//                             </Link>
//                             <Link href="/register" className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full shadow-md shadow-red-600/20 transition">
//                                 สมัครสมาชิก
//                             </Link>
//                         </div>
//                     )}
//                 </div>

//             </div>
//         </header>
//     );
// }

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';

// ขยาย Type User ให้รองรับ doctorType อย่างถูกต้องตามหลัก TypeScript
type ExtendedUser = User & {
  doctorType?: string;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ExtendedUser | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          const parsedUser: ExtendedUser = JSON.parse(saved);
          setUser(parsedUser);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    checkUser();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const isDoctor = user?.status === 'DOCTOR' || Boolean(user?.doctorType);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e60000] rounded-full flex items-center justify-center text-white text-[18px] font-black">
            V
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[17px] font-black text-[#001f3f] leading-none tracking-tight">
              VacciCare
            </h1>
            <span className="text-[10px] font-black text-[#e60000] tracking-widest uppercase mt-0.5">
              Vaccination Portal
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <Link href="/" className={`transition ${pathname === '/' ? 'text-red-600' : 'hover:text-red-600'}`}>
            หน้าแรก
          </Link>

          {(!user || user.status === 'USER') && (
            <Link
              href="/my-appointments"
              className={`transition ${pathname === '/my-appointments' ? 'text-red-600' : 'hover:text-red-600'}`}
            >
              การนัดหมายของฉัน
            </Link>
          )}

          {user?.status === 'ADMIN' && (
            <Link href="/admin" className="text-sky-600 hover:text-sky-700 transition">
              หน้าจัดการ (Admin)
            </Link>
          )}

          {isDoctor && (
            <Link href="/doctor" className="text-sky-600 hover:text-sky-700 transition">
              หน้าจัดการคิว (Doctor)
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-700">{user.name}</p>
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                  {user.status || 'USER'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-full border border-slate-200 hover:border-red-200 transition cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-red-600 transition px-2">
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full shadow-md shadow-red-600/20 transition"
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}