import { NextRequest, NextResponse } from 'next/server';

const BACKEND_TASKS_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/tasks';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const response = await fetch(`${BACKEND_TASKS_URL}/${params.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const response = await fetch(`${BACKEND_TASKS_URL}/${params.id}`, {
    method: 'DELETE',
  });
  return new NextResponse(null, { status: response.status });
}
