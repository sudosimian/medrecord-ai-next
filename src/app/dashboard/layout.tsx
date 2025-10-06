'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Brain, 
  Scale, 
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Calendar
} from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Cases', href: '/cases', icon: Scale },
    { name: 'Records', href: '/records', icon: FileText },
    { name: 'Chronology', href: '/chronology', icon: Calendar },
    { name: 'Narrative', href: '/narrative', icon: FileText },
    { name: 'Billing', href: '/billing', icon: FileText },
    { name: 'Depositions', href: '/depositions', icon: FileText },
    { name: 'Demand Letter', href: '/demand-letter', icon: FileText },
    { name: 'Case Summary', href: '/case-summary', icon: FileText },
    { name: 'Providers', href: '/providers', icon: FileText },
    { name: 'Missing Records', href: '/missing-records', icon: FileText },
    { name: 'Synopsis', href: '/synopsis', icon: FileText },
  ]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900">MedRecord AI</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">DR</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">Dr. Smith</p>
                <p className="text-xs text-slate-500 truncate">Admin</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6 text-slate-900" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, records..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </header>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}

