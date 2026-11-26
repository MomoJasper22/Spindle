import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { UsersPanel } from '@/features/admin/components/users-panel'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import type { UserWithRole } from '@/types/database'

export const metadata: Metadata = {
  title: 'Users Directory',
}

async function AdminUsersContent() {
  const profile = await requireRole('admin')
  const supabase = await createClient()

  const { data } = await supabase
    .from('users')
    .select('*, user_types(type_name, description)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Users Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage customer, technician, and administrator accounts across Philippine branches.
        </p>
      </div>

      <UsersPanel
        users={(data ?? []) as UserWithRole[]}
        currentAdminId={profile.user_id}
      />
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminUsersContent />
    </Suspense>
  )
}
