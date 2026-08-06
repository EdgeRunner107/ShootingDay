import React from "react";
import PlayerPage from "./pages/PlayerPage";
import AdminPage from "./pages/AdminPage";

function normalizePath(pathname) {
  const clean = pathname.replace(/\/+$/, "");
  return clean || "/play";
}

export default function App() {
  const path = normalizePath(window.location.pathname);

  if (path === "/admin") {
    return <AdminPage />;
  }

  if (path === "/play" || path === "/") {
    return <PlayerPage />;
  }

  return (
    <div className="app">
      <section className="login-panel card">
        <div className="card-head">
          <div>
            <h2>페이지를 찾을 수 없습니다</h2>
            <p>아래 링크 중 하나로 이동하세요.</p>
          </div>
        </div>
        <div className="card-body stack">
          <a className="btn primary full-button link-button" href="/play">
            플레이어 페이지
          </a>
          <a className="btn ghost full-button link-button" href="/admin">
            관리자 페이지
          </a>
        </div>
      </section>
    </div>
  );
}
