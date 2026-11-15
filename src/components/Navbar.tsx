import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryActionTarget = user
    ? user.role === 'admin'
      ? '/admin'
      : '/member'
    : '/login';

  const primaryActionLabel = user
    ? user.role === 'admin'
      ? 'Admin Console'
      : 'Member Portal'
    : 'Sign In';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors pb-0.5 border-b ${
      isActive
        ? 'text-[#166534] border-[#166534]'
        : 'text-[#3B4E42] border-transparent hover:text-[#14261C] hover:border-[#14261C]/30'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8E0] bg-[#F9FAF8]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/"
          className="font-display text-xl font-semibold tracking-tight text-[#14261C] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
        >
          Verdant Bowl
        </Link>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          <NavLink to="/menu" className={navLinkClass}>
            Menu
          </NavLink>
          <NavLink to="/plans" className={navLinkClass}>
            Plans
          </NavLink>
          <NavLink to="/builder" className={navLinkClass}>
            Salad Builder
          </NavLink>
          <NavLink to="/cart" className={navLinkClass}>
            <span className="tabular-nums">
              Cart{totalItems > 0 ? ` (${totalItems})` : ''}
            </span>
          </NavLink>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate(primaryActionTarget)}
            className="hidden md:inline-flex items-center justify-center rounded-lg bg-[#166534] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#14532D] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] focus-visible:ring-offset-2"
          >
            {primaryActionLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4DFD1] text-[#14261C] md:hidden"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#E2E8E0] bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              to="/menu"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm font-medium text-[#14261C]"
            >
              Menu
            </Link>
            <Link
              to="/plans"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm font-medium text-[#14261C]"
            >
              Membership Plans
            </Link>
            <Link
              to="/builder"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm font-medium text-[#14261C]"
            >
              Salad Builder
            </Link>
            <Link
              to="/cart"
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm font-medium text-[#14261C] tabular-nums"
            >
              Cart{totalItems > 0 ? ` (${totalItems})` : ''}
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate(primaryActionTarget);
              }}
              className="mt-2 w-full rounded-lg bg-[#166534] px-4 py-2.5 text-sm font-medium text-white"
            >
              {primaryActionLabel}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
