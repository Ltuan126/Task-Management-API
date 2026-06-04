import type { User } from "../types";

type Props = {
  user: User;
  onLogout: () => void;
};

export function TopBar({ user, onLogout }: Props) {
  return (
    <header className="top-bar">
      <div className="top-bar-copy">
        <p className="eyebrow">Workspace</p>
        <p>
          Welcome back, <strong>{user.name}</strong>. Your tasks are live, filtered, and ready to
          manage.
        </p>
      </div>
      <button className="secondary" type="button" onClick={onLogout}>
        Logout
      </button>
    </header>
  );
}
