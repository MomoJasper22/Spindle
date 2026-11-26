import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_FEATURES, type AdminFeatureKey, type UserRole } from '@/lib/constants'

function getAdminDefaultPath(permissions: AdminFeatureKey[] | null | undefined): string {
  if (!permissions) return '/admin/dashboard'
  const first = ADMIN_FEATURES.find((f) => permissions.includes(f.key))
  return first ? first.href : '/admin/profile'
}

function getRoleHomePath(role: UserRole, adminPermissions?: AdminFeatureKey[] | null): string {
  switch (role) {
    case 'customer':
      return '/customer/home'
    case 'technician':
      return '/technician/dashboard'
    case 'admin':
      return getAdminDefaultPath(adminPermissions)
  }
}

function redirectWithCookies(url: URL, sourceResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url)
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
  })
  return redirectResponse
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtectedRoleRoute =
    pathname.startsWith('/customer') ||
    pathname.startsWith('/technician') ||
    pathname.startsWith('/admin')
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  if (!user) {
    if (isProtectedRoleRoute || isOnboardingRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return redirectWithCookies(loginUrl, supabaseResponse)
    }
    return supabaseResponse
  }

  if (!isProtectedRoleRoute && !isOnboardingRoute && !isAuthRoute) {
    return supabaseResponse
  }

  const { data: profile } = await supabase
    .from('users')
    .select('user_id, is_onboarded, is_active, admin_permissions, user_types(type_name)')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const rawUserTypes = profile?.user_types as unknown
  const rawRole = Array.isArray(rawUserTypes)
    ? (rawUserTypes[0] as { type_name?: UserRole } | undefined)?.type_name
    : (rawUserTypes as { type_name?: UserRole } | null)?.type_name

  // Inactive or unlinked users are signed out and blocked
  if (!profile || !profile.is_active || !rawRole) {
    await supabase.auth.signOut()
    if (isAuthRoute) {
      return supabaseResponse
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'account_inactive')
    return redirectWithCookies(loginUrl, supabaseResponse)
  }

  if (!profile.is_onboarded) {
    if (!isOnboardingRoute) {
      return redirectWithCookies(new URL('/onboarding', request.url), supabaseResponse)
    }
    return supabaseResponse
  }

  const adminPermissions = Array.isArray(profile.admin_permissions)
    ? (profile.admin_permissions as AdminFeatureKey[])
    : null
  const roleHome = getRoleHomePath(rawRole, adminPermissions)

  if (isOnboardingRoute || isAuthRoute) {
    return redirectWithCookies(new URL(roleHome, request.url), supabaseResponse)
  }

  if (pathname.startsWith('/customer') && rawRole !== 'customer') {
    return redirectWithCookies(new URL(roleHome, request.url), supabaseResponse)
  }
  if (pathname.startsWith('/technician') && rawRole !== 'technician') {
    return redirectWithCookies(new URL(roleHome, request.url), supabaseResponse)
  }
  if (pathname.startsWith('/admin') && rawRole !== 'admin') {
    return redirectWithCookies(new URL(roleHome, request.url), supabaseResponse)
  }
  if (rawRole === 'admin' && adminPermissions) {
    const matchedFeature = ADMIN_FEATURES.find(
      (f) => pathname === f.href || pathname.startsWith(`${f.href}/`)
    )
    if (matchedFeature && !adminPermissions.includes(matchedFeature.key)) {
      return redirectWithCookies(new URL(roleHome, request.url), supabaseResponse)
    }
  }

  return supabaseResponse
}
