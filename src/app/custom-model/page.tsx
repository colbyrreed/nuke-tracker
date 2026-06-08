// src/app/custom-model/page.tsx
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { CustomModelBuilder } from '@/components/model/custom-model-builder'
import { ProGate } from '@/components/ui/pro-gate'

export const dynamic = 'force-dynamic'

export default async function CustomModelPage() {
  const { userId } = await auth()
  const user = userId
    ? await db.user.findUnique({ where: { clerkId: userId }, select: { plan: true } })
    : null
  const isElite = user?.plan === 'ELITE'

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-border rounded-lg px-5 py-4">
        <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
          Custom <span className="text-nuke-red">Model Builder</span>
        </h1>
        <p className="text-xs text-nuke-muted mt-1">
          Adjust feature weights and generate your own custom HR rankings
        </p>
      </div>
      {isElite
        ? <CustomModelBuilder />
        : <ProGate title="Unlock Custom Model Builder" description="Elite members can create custom models by adjusting feature weights — barrel rate, weather, pitcher vulnerability, park factor, and more — and instantly regenerate rankings." plan="ELITE" />
      }
    </div>
  )
}
