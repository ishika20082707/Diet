import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[#E2E8E0] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-[#14261C]">
            Verdant Bowl
          </p>
          <p className="mt-1 text-sm text-[#52665A]">
            Fresh farm-sourced diet bowls prepared each morning and delivered chilled.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 text-sm text-[#52665A]">
          <Link to="/menu" className="hover:text-[#14261C] transition-colors">
            Daily Menu
          </Link>
          <Link to="/plans" className="hover:text-[#14261C] transition-colors">
            Membership Plans
          </Link>
          <Link to="/builder" className="hover:text-[#14261C] transition-colors">
            Salad Builder
          </Link>
          <Link to="/login" className="hover:text-[#14261C] transition-colors">
            Member Sign In
          </Link>
        </nav>

        <p className="text-xs text-[#6B7F73]">
          &copy; {new Date().getFullYear()} Verdant Bowl Kitchen. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
