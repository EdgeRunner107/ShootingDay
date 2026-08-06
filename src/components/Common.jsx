import React from "react";

export function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast show">{message}</div>;
}

export function ConfigNotice() {
  return (
    <div className="notice">
      Supabase 환경변수가 설정되지 않았습니다. UI는 확인할 수 있지만 데이터 저장은 동작하지 않습니다.
    </div>
  );
}
