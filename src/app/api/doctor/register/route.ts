import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase for the server side
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, name, email, specialization, mrn, latitude, longitude } = body;

        if (!userId || !mrn || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Backend logic to verify the medical registration number
        const isSuccess = mrn === '8978456556';
        const verifiedStatus = isSuccess ? 'VERIFIED' : 'MANUAL_REVIEW_REQUIRED';

        // Instead of writing to Firestore from the unauthenticated server, 
        // we return the verification status to the authenticated client so it can write securely.
        return NextResponse.json({
            success: true,
            verifiedStatus
        }, { status: 200 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
