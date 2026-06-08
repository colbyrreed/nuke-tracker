// src/components/admin/admin-user-table.tsx
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'

interface UserRow {
  id: string
  email: string
  name: string | null
  plan: string
  createdAt: Date
  subscriptionEnd: Date | null
}

const PLAN_STYLES: Record<string, string> = {
  FREE:  'bg-border text-nuke-muted',
  PRO:   'bg-nuke-gold/15 text-nuke-gold border border-nuke-gold/30',
  ELITE: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
}

export function AdminUserTable({ users }: { users: UserRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {['Name / Email', 'Plan', 'Joined', 'Sub Expires'].map((h) => (
              <th key={h} className="text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <motion.tr
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-[#0f1e30] last:border-0 hover:bg-white/[0.01] transition-colors"
            >
              <td className="py-2.5 pr-4">
                <div className="font-medium text-white">{user.name ?? '—'}</div>
                <div className="text-xs text-nuke-muted">{user.email}</div>
              </td>
              <td className="py-2.5 pr-4">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', PLAN_STYLES[user.plan])}>
                  {user.plan}
                </span>
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs text-nuke-muted2">
                {format(new Date(user.createdAt), 'MM/dd/yy')}
              </td>
              <td className="py-2.5 font-mono text-xs text-nuke-muted2">
                {user.subscriptionEnd ? format(new Date(user.subscriptionEnd), 'MM/dd/yy') : '—'}
              </td>
            </motion.tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-nuke-muted text-xs">No users yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
