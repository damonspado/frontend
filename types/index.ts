// export interface Category {
//     categoryId: string;
//     categoryName: string;
// }

// export interface Vaccine {
//     id: number;
//     name: string;
//     description: string;
//     price: number;
//     discountPrice: number;
//     category: Category;
// }

// export interface User {
//     id: number;
//     email: string;
//     name: string;
//     phoneNumber?: string;
//     status: string; // USER, ADMIN
// }

// export interface Recipient {
//     id: number;
//     name: string;
//     type: 'HUMAN' | 'PET';
//     species?: string;
//     birthDate?: string;
// }

// export interface Doctor {
//     id: number;
//     name: string;
//     specialty: string;
//     doctorType: string;
// }

// export interface Appointment {
//     id: number;
//     appointmentCode: string;
//     user: User;
//     vaccine: Vaccine;
//     recipient: Recipient;
//     doctor?: Doctor;
//     appointmentDate: string;
//     timeSlot: string;
//     totalPrice: number;
//     status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
//     notes?: string;
// }

export interface Category {
    categoryId: string;
    categoryName: string;
}

export interface Doctor {
    id: number;
    name: string;
    email?: string;
    specialty: string;
    licenseNumber?: string;
    doctorType: string;
    phoneNumber?: string;
}

export interface Vaccine {
    id: number;
    name: string;
    description: string;
    price: number;
    discountPrice: number;
    imageUrl?: string;
    category: Category;
    doctor?: Doctor;
}

export interface User {
    id: number;
    email: string;
    name: string;
    phoneNumber?: string;
    status: string; // USER, ADMIN, DOCTOR
    doctorType?: string;
}

export interface Recipient {
    id: number;
    name: string;
    type: 'HUMAN' | 'PET';
    species?: string;
    birthDate?: string;
}

export interface Appointment {
    id: number;
    appointmentCode: string;
    user: User;
    vaccine: Vaccine;
    recipient: Recipient;
    doctor?: Doctor;
    staffName?: string;
    appointmentDate: string;
    timeSlot: string;
    totalPrice: number;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
}