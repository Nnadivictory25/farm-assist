import {
  BarChart3,
  Home,
  Leaf,
  MapPin,
  Package,
  Receipt,
  Wallet,
} from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Fields', url: '/dashboard/fields', icon: MapPin },
  { title: 'Crops', url: '/dashboard/crops', icon: Leaf },
  { title: 'Expenses', url: '/dashboard/expenses', icon: Wallet },
  { title: 'Harvests', url: '/dashboard/harvests', icon: Package },
  { title: 'Sales', url: '/dashboard/sales', icon: Receipt },
  { title: 'Reports', url: '/dashboard/reports', icon: BarChart3 },
]

export function AppSidebar() {
  const location = useLocation()
  const { setOpenMobile, isMobile } = useSidebar()

  function handleNavClick() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo className="text-xl" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        isActive &&
                          'bg-primary! text-white! hover:bg-primary/90!',
                        'p-5',
                      )}
                    >
                      <Link to={item.url} onClick={handleNavClick}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
