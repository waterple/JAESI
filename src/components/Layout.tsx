import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "홈" },
  { to: "/study", label: "암기" },
  { to: "/quiz/random", label: "랜덤" },
  { to: "/quiz/spaced", label: "복습" },
  { to: "/quiz/sequential", label: "순차" },
  { to: "/wrong-answers", label: "오답" },
] as const;

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <nav className="sticky bottom-0 border-t border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `flex-1 py-3 text-center text-sm font-medium transition-colors min-h-[48px] flex items-center justify-center ${
                  isActive ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-500"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
