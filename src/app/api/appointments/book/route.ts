import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase for the server side
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { practitionerId, patientId, date, patientName, patientEmail, patientPhone, patientDescription } = body;

        if (!practitionerId || !patientId || !date || !patientName || !patientEmail || !patientPhone || !patientDescription) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Backend logic ensuring appointment slots are valid could go here

        // Return success to the client without writing to Firestore here, 
        // because unauthenticated writes on the server are rejected by security rules.
        return NextResponse.json({
            success: true
        }, { status: 200 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
