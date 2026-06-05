import { NextRequest, NextResponse } from 'next/server';

const BACKEND_TASKS_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/tasks';

export async function GET() {
  const response = await fetch(BACKEND_TASKS_URL, { cache: 'no-store' });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch(BACKEND_TASKS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
