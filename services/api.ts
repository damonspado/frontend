import { Vaccine, User, Recipient, Appointment } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api';

export const api = {

    getVaccines: async (categoryId?: string): Promise<Vaccine[]> => {
        const url = categoryId ? `${API_BASE}/vaccines?category=${categoryId}` : `${API_BASE}/vaccines`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('โหลดข้อมูลวัคซีนไม่สำเร็จ');
        return res.json();
    },

    getVaccineById: async (id: string | number): Promise<Vaccine> => {
        const res = await fetch(`${API_BASE}/vaccines/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('ไม่พบข้อมูลวัคซีน');
        return res.json();
    },

    login: async (credentials: { email: string; password: string }): Promise<User> => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
        }
        return res.json();
    },

    register: async (payload: { name: string; email: string; password: string; phoneNumber?: string }): Promise<User> => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'สมัครสมาชิกไม่สำเร็จ');
        }
        return res.json();
    },

    deleteRecipient: async (id: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/recipients/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            throw new Error('ลบข้อมูลผู้รับวัคซีนไม่สำเร็จ');
        }
    },

    cancelAppointment: async (id: number): Promise<Appointment> => {
        const res = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'ยกเลิกนัดหมายไม่สำเร็จ');
        }
        return res.json();
    },

    getRecipients: async (userId: number): Promise<Recipient[]> => {
        const res = await fetch(`${API_BASE}/recipients?userId=${userId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('โหลดรายชื่อผู้รับวัคซีนไม่สำเร็จ');
        return res.json();
    },

    addRecipient: async (
        userId: number,
        payload: { name: string; type: string; species?: string | null; birthDate?: string | null }
    ): Promise<Recipient> => {
        const res = await fetch(`${API_BASE}/recipients?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'บันทึกผู้รับวัคซีนไม่สำเร็จ');
        }
        return res.json();
    },

    getUserAppointments: async (userId: number, status?: string): Promise<Appointment[]> => {
        const url = status ? `${API_BASE}/appointments?userId=${userId}&status=${status}` : `${API_BASE}/appointments?userId=${userId}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('โหลดรายการนัดหมายไม่สำเร็จ');
        return res.json();
    },

    createAppointment: async (payload: {
        userId: number;
        vaccineId: number;
        recipientId: number;
        appointmentDate: string;
        timeSlot: string;
        notes?: string;
    }): Promise<Appointment> => {
        const res = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'จองนัดหมายไม่สำเร็จ');
        }
        return res.json();
    },

    createVaccine: async (formData: FormData) => {
        const res = await fetch(`${API_BASE}/vaccines`, {
            method: 'POST',

            body: formData,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'เพิ่มวัคซีนไม่สำเร็จ');
        }
        return res.json();
    },

    updateVaccine: async (id: number, formData: FormData) => {
        const res = await fetch(`${API_BASE}/vaccines/${id}/update`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'แก้ไขวัคซีนไม่สำเร็จ');
        }
        return res.json();
    },

    deleteVaccine: async (id: number) => {
        const res = await fetch(`${API_BASE}/vaccines/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('ลบวัคซีนไม่สำเร็จ (อาจมีประวัติการจองค้างอยู่)');
    },

    getAllAppointments: async (): Promise<Appointment[]> => {
        const res = await fetch(`${API_BASE}/appointments`, { cache: 'no-store' });
        if (!res.ok) throw new Error('โหลดรายการนัดหมายทั้งหมดไม่สำเร็จ');
        return res.json();
    },

    loginDoctor: async (credentials: { email: string; password: string }): Promise<User> => {
        const res = await fetch(`${API_BASE}/doctors/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'อีเมลหรือรหัสผ่านแพทย์ไม่ถูกต้อง');
        }
        return res.json();
    },

    updateAppointmentStatus: async (id: number, payload: { status: string; staffName?: string }) => {
        const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'อัปเดตสถานะไม่สำเร็จ');
        }
        return res.json();
    },

};