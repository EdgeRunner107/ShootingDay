import React from "react";
import PlayerPage from "./pages/PlayerPage";
import AdminPage from "./pages/AdminPage";

function normalizePath(pathname) {
  let path = pathname || "/";

  // 마지막 슬래시 제거
  path = path.replace(/\/+$/, "");

  // 루트는 플레이어 페이지
  if (path === "") {
    path = "/";
  }

  return path.toLowerCase();
}

export default function App() {
  const path = normalizePath(window.location.pathname);

  switch (path) {
    case "/":
    case "/play":
      return <PlayerPage />;

    case "/adminvss":
      return <AdminPage />;

    default:
      return (
        <div className="app">
          <section className="login-panel card">
            <div className="card-head">
              <div>
                <h2>페이지를 찾을 수 없습니다.</h2>
                <p>아래 메뉴를 선택하세요.</p>
              </div>
            </div>

            <div className="card-body stack">
              <a
                className="btn primary full-button link-button"
                href="/play"
              >
                플레이어 페이지
              </a>

              <a
                className="btn ghost full-button link-button"
                href="/admin"
              >
                관리자 페이지
              </a>
            </div>
          </section>
        </div>
      );
  }
}