import type { Sql } from 'postgres';

export interface CategoryWithScore {
    category: string;
    score: number;
}

export interface Bill {
    billId: number;
    title: string;
    description: string;
    inferred_categories: CategoryWithScore[];
    subjects: string[];
    embedding?: number[];
    pdfUrl?: string;
    createdAt: Date;
    sponsors?: Sponsor[];
}

export interface Sponsor {
    sponsorId: number;
    name: string;
    party: string;
    district: string;
    role: string;
}

export interface RollCall {
    rollCallId: number;
    billId: number;
    date: Date;
    yea: number;
    nay: number;
    nv: number;
    absent: number;
    passed: boolean;
    chamber: string;
    chamber_id: number;
}

export interface RollCallVote {
    rollCallId: number;
    sponsorId: number;
    vote: 'Yea' | 'Nay' | 'NV' | 'Absent';
}

export interface BillSponsor {
    billId: number;
    sponsorId: number;
}

export interface ProcessTracker {
    id: number;
    absolutePath: string;
    fileType: 'bill' | 'vote' | 'people';
    state: string;
    session: string;
    lastProcessedRecord: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    updatedAt: Date;
}

export interface ImporterConfig {
    sql: Sql;
    rootDir: string;
} 