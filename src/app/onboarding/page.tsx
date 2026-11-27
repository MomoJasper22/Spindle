import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getRoleHomePath, requireAuthenticatedUser } from '@/lib/auth/session'
import { formatFullName } from '@/lib/formatters'
import { SpindleLogo } from '@/components/shared/spindle-logo'
import { OnboardingForm } from '@/features/onboarding/components/onboarding-form'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { signOutAction } from '@/features/auth/actions/auth-actions'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Complete Setup',
}

async function OnboardingContent() {
  const profile = await requireAuthenticatedUser({ allowUnonboarded: true })

  if (profile.is_onboarded) {
    redirect(getRoleHomePath(profile.role, profile))
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <SpindleLogo variant="dark" showTagline />
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Log Out
            </Button>
          </form>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6"
      >
        <OnboardingForm
          firstName={profile.first_name}
          fullName={formatFullName(profile)}
          role={profile.role}
          avatarUrl={profile.avatar_url}
          avatarPosition={profile.avatar_position}
          assignedSpecializations={profile.technician_profile?.specializations ?? []}
          initialValues={{
            phone: profile.phone ?? '',
            branch_location:
              (profile.branch_location as Parameters<typeof OnboardingForm>[0]['initialValues'] extends infer T
                ? T extends { branch_location?: infer B }
                  ? B
                  : never
                : never) ?? undefined,
            address_street: profile.address_street ?? '',
            address_barangay: profile.address_barangay ?? '',
            address_city: profile.address_city ?? '',
            address_province: profile.address_province ?? 'Metro Manila',
            address_zip_code: profile.address_zip_code ?? '',
            nickname: profile.nickname ?? '',
            proposed_specializations: profile.technician_profile?.proposed_specializations ?? [],
            certification_no: profile.technician_profile?.certification_no ?? '',
          }}
        />
      </main>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OnboardingContent />
    </Suspense>
  )
}
