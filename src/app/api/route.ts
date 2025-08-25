import connectDB from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ message: 'Database connected successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to connect to the database', error: (error as Error).message },
      { status: 500 }
    );
  }
}
