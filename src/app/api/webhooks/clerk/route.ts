// src/app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  let event: any
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET ?? '')
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { type, data } = event

  switch (type) {
    case 'user.created':
      await db.user.upsert({
        where: { clerkId: data.id },
        create: {
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address ?? '',
          name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
          avatarUrl: data.image_url ?? null,
        },
        update: {},
      })
      break

    case 'user.updated':
      await db.user.updateMany({
        where: { clerkId: data.id },
        data: {
          email: data.email_addresses?.[0]?.email_address ?? undefined,
          name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
          avatarUrl: data.image_url ?? null,
        },
      })
      break

    case 'user.deleted':
      await db.user.deleteMany({ where: { clerkId: data.id } })
      break
  }

  return NextResponse.json({ received: true })
}
