// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-nuke-red rounded-lg flex items-center justify-center text-xl">💣</div>
          <span className="font-condensed font-black text-2xl text-white tracking-wide">NUKE TRACKER</span>
        </div>
        <SignIn />
      </div>
    </div>
  )
}
