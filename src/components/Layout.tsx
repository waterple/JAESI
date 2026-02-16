import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "홈", icon: "📊" },
  { to: "/study", label: "암기", icon: "📖" },
  { to: "/quiz/random", label: "랜덤", icon: "🎲" },
  { to: "/quiz/spaced", label: "복습", icon: "🔄" },
  { to: "/quiz/sequential", label: "순차", icon: "📝" },
  { to: "/wrong-answers", label: "오답", icon: "❌" },
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
                `flex-1 py-2 text-center text-xs font-medium transition-colors min-h-[48px] flex flex-col items-center justify-center gap-0.5 ${
                  isActive ? "text-blue-600 border-t-2 border-blue-600 bg-blue-50" : "text-gray-500"
                }`
              }
            >
              <span className="text-base leading-none">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
