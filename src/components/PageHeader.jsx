import React from "react";

export default function PageHeader({ type }) {
  const isAdmin = type === "admin";

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">🎯</div>
        <div>
          <h1>익명 탄환 게임</h1>
          <p>{isAdmin ? "관리자 전용 페이지" : "플레이어 전용 페이지"}</p>
        </div>
      </div>

      <a
        className="btn ghost link-button"
        href={isAdmin ? "/play" : "/admin"}
      >
        {isAdmin ? "플레이어 페이지" : "관리자 페이지"}
      </a>
    </header>
  );
}
