import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { AuthCallback } from '@/screens/auth-callback'
import { DesignTokens } from '@/screens/design-tokens'
import { Home } from '@/screens/home'

const rootRoute = createRootRoute({ component: Outlet })

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallback,
})
const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design',
  component: DesignTokens,
})

export const routeTree = rootRoute.addChildren([homeRoute, callbackRoute, designRoute])

export function makeRouter() {
  return createRouter({ routeTree })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof makeRouter>
  }
}
