import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAdminFeature } from '@/lib/auth/session'
import { getAdminUsers } from '@/lib/data/portal-data'
import { UsersPanel } from '@/features/admin/components/users-panel'
import { PortalContentSkeleton } from '@/components/shared/page-skeleton'

export const metadata: Metadata = {
  title: 'Users Directory',
}

async function AdminUsersContent() {
  const profile = await requireAdminFeature('users')
  const users = await getAdminUsers()

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
        users={users}
        currentAdminId={profile.user_id}
        currentAdminPermissions={profile.admin_permissions}
      />
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<PortalContentSkeleton />}>
      <AdminUsersContent />
    </Suspense>
  )
}
