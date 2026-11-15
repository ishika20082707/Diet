import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarCheck, LayoutDashboard, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MemberLayoutProps {
  breadcrumb: string;
  title: string;
  children: React.ReactNode;
}

export function MemberLayout({ breadcrumb, title, children }: MemberLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-[#166534] text-white'
        : 'text-[#3B4E42] hover:bg-[#F1F5F0] hover:text-[#14261C]'
    }`;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="rounded-xl border border-[#E2E8E0] bg-white p-5">
          <div className="border-b border-[#E2E8E0] pb-4">
            <p className="text-xs font-medium text-[#52665A]">Member Account</p>
            <p className="mt-0.5 truncate text-base font-semibold text-[#14261C]">
              {user?.name}
            </p>
            <p className="truncate text-xs text-[#52665A]">{user?.email}</p>
          </div>

          <nav className="mt-4 flex flex-col gap-1" aria-label="Member navigation">
            <NavLink to="/member" end className={linkClass}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Overview
            </NavLink>
            <NavLink to="/member/orders" className={linkClass}>
              <ShoppingBag className="h-4 w-4 shrink-0" />
              My Orders
            </NavLink>
            <NavLink to="/member/subscription" className={linkClass}>
              <CalendarCheck className="h-4 w-4 shrink-0" />
              My Subscription
            </NavLink>
          </nav>

          <div className="mt-6 border-t border-[#E2E8E0] pt-4">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">
        <div className="mb-6 border-b border-[#E2E8E0] pb-4">
          <p className="text-xs font-medium text-[#52665A]">
            Member Portal / {breadcrumb}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-[#14261C] sm:text-3xl">
            {title}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
}
