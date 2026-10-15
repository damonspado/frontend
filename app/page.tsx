'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/services/api';
import { Vaccine } from '@/types';

type CategoryInfo = {
  id?: string | number;
  categoryId?: string | number;
  name?: string;
  categoryName?: string;
};

type ExtendedVaccine = Vaccine & {
  imageUrl?: string;
  image?: string;
  categoryId?: string | number;
  categoryName?: string;
};

export default function HomePage() {
  const router = useRouter();

  const [vaccines, setVaccines] = useState<ExtendedVaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'HUMAN' | 'PET'>('ALL');
  const [priceRange, setPriceRange] = useState<'all' | 'under500' | '501-1000' | 'over1000'>('all');
  const [sortOption, setSortOption] = useState<'recommend' | 'priceAsc' | 'priceDesc'>('recommend');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getVaccines();
        setVaccines(data as ExtendedVaccine[]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBookingClick = (e: React.MouseEvent) => {
    const saved = localStorage.getItem('user');
    if (!saved) {
      e.preventDefault();
      router.push('/login');
    }
  };

  const filtered = vaccines
    .filter((v) => {
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchName = v.name.toLowerCase().includes(query);
        const matchDesc = v.description?.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }

      if (categoryFilter !== 'ALL') {
        const catObj = (v.category || {}) as CategoryInfo;
        const catId = String(catObj.categoryId || catObj.id || v.categoryId || '').trim();
        const catName = String(catObj.categoryName || catObj.name || v.categoryName || '').toLowerCase();

        const isPet = catId === '2' || catName.includes('สัตว์') || catName.includes('pet');
        const isHuman = catId === '1' || catName.includes('คน') || catName.includes('ทั่วไป') || !isPet;

        if (categoryFilter === 'HUMAN' && !isHuman) return false;
        if (categoryFilter === 'PET' && !isPet) return false;
      }

      const currentPrice = (v.discountPrice ?? 0) > 0 ? v.discountPrice : v.price;
      if (priceRange === 'under500' && currentPrice > 500) return false;
      if (priceRange === '501-1000' && (currentPrice < 501 || currentPrice > 1000)) return false;
      if (priceRange === 'over1000' && currentPrice <= 1000) return false;

      return true;
    })
    .sort((a, b) => {
      const priceA = (a.discountPrice ?? 0) > 0 ? a.discountPrice : a.price;
      const priceB = (b.discountPrice ?? 0) > 0 ? b.discountPrice : b.price;

      if (sortOption === 'priceAsc') return priceA - priceB;
      if (sortOption === 'priceDesc') return priceB - priceA;
      return a.id - b.id;
    });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-8">
        {/* แถบตัวกรองด้านซ้าย */}
        <aside className="w-full md:w-64 shrink-0 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-800">ตัวกรองการค้นหา</h2>
          </div>

          <div className="border-b border-slate-200/80 pb-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
              <span>หมวดหมู่ผู้รับบริการ</span>
              <span className="text-slate-400">⌵</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer ${
                  categoryFilter === 'ALL' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('HUMAN')}
                className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer ${
                  categoryFilter === 'HUMAN' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                วัคซีนสำหรับคน
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('PET')}
                className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer ${
                  categoryFilter === 'PET' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                วัคซีนสำหรับสัตว์เลี้ยง
              </button>
            </div>
          </div>

          <div className="border-b border-slate-200/80 pb-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
              <span>ช่วงราคา</span>
              <span className="text-slate-400">⌵</span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={priceRange === 'all'}
                  onChange={() => setPriceRange('all')}
                  className="accent-red-600"
                />
                ทุกช่วงราคา
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={priceRange === 'under500'}
                  onChange={() => setPriceRange('under500')}
                  className="accent-red-600"
                />
                ไม่เกิน ฿500
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={priceRange === '501-1000'}
                  onChange={() => setPriceRange('501-1000')}
                  className="accent-red-600"
                />
                ฿501 – ฿1,000
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={priceRange === 'over1000'}
                  onChange={() => setPriceRange('over1000')}
                  className="accent-red-600"
                />
                มากกว่า ฿1,000
              </label>
            </div>
          </div>
        </aside>

        {/* รายการวัคซีนด้านขวา */}
        <main className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
            <Link href="/" className="hover:text-red-600">
              หน้าแรก
            </Link>
            <span>›</span>
            <span>แพ็กเกจสุขภาพ</span>
            <span>›</span>
            <span className="text-red-600 font-medium">ฉีดวัคซีนป้องกันโรค</span>
          </div>

          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            ฉีดวัคซีนป้องกันโรค (Vaccination Packages)
          </h1>
          <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
            บริการฉีดวัคซีนมาตรฐานในราคาสุดคุ้ม จองคิวออนไลน์ได้ทันที พร้อมทีมแพทย์ดูแลทุกขั้นตอน
          </p>

          <div className="relative mb-5">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อวัคซีน"
              className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 shadow-2xs transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/60">
            <span className="text-xs font-bold text-slate-600">
              กำลังโชว์ <span className="text-red-600">{filtered.length}</span> แพ็กเกจ
              {searchTerm && <span className="text-slate-400 font-normal"> (จากการค้นหา &quot;{searchTerm}&quot;)</span>}
            </span>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-slate-400">เรียงตาม</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as 'recommend' | 'priceAsc' | 'priceDesc')}
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white focus:outline-none focus:border-red-500 text-xs cursor-pointer shadow-2xs"
              >
                <option value="recommend">แนะนำ</option>
                <option value="priceAsc">ราคาต่ำสุด - สูงสุด</option>
                <option value="priceDesc">ราคาสูงสุด - ต่ำสุด</option>
              </select>
            </div>
          </div>

          {loading && <div className="py-16 text-center text-xs text-slate-400">กำลังโหลดข้อมูลแพ็กเกจวัคซีน...</div>}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl text-center">
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-600">ไม่พบแพ็กเกจวัคซีนที่ตรงกับเงื่อนไข</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => {
                const finalPrice = (item.discountPrice ?? 0) > 0 ? item.discountPrice : item.price;
                const hasDiscount = (item.discountPrice ?? 0) > 0 && item.discountPrice < item.price;
                const imageUrl = item.imageUrl || item.image;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col h-full group"
                  >
                    <div className="w-full aspect-[4/3] bg-white relative border-b border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                          <span className="text-xs text-slate-400">ไม่มีรูปภาพ</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug line-clamp-2 min-h-[40px]">
                        {item.name}
                      </h3>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-4 leading-relaxed min-h-[36px]">
                        {item.description || 'บริการฉีดวัคซีนป้องกันโรคมาตรฐาน'}
                      </p>

                      <div className="mt-auto pt-2">
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-xs font-bold text-slate-800">เข็มละ</span>
                          <div className="flex items-baseline gap-2">
                            {hasDiscount && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ฿{item.price.toLocaleString()}
                              </span>
                            )}
                            <span className="text-lg font-black text-red-600">
                              ฿{finalPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/vaccines/${item.id}`}
                            onClick={handleBookingClick}
                            className="flex-1 py-2 rounded-lg border border-red-600 text-red-600 bg-white font-bold text-xs hover:bg-red-50 transition text-center shadow-sm"
                          >
                            รายละเอียด
                          </Link>
                          <Link
                            href={`/vaccines/${item.id}`}
                            onClick={handleBookingClick}
                            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition text-center shadow-sm"
                          >
                            จองทันที
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}