// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-nuke-red rounded-lg flex items-center justify-center text-xl">💣</div>
          <span className="font-condensed font-black text-2xl text-white tracking-wide">NUKE TRACKER</span>
        </div>
        <p className="text-nuke-muted text-sm text-center max-w-xs">
          The most advanced MLB home run analytics platform. Free forever, upgrade for full access.
        </p>
        <SignUp />
      </div>
    </div>
  )
}
