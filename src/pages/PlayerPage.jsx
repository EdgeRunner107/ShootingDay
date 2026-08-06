import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

function remaining(player) {
  return Math.max(
    0,
    Number(player?.received_bullets || 0) -
      Number(player?.fired_bullets || 0)
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function parseTargetName(actionText = "") {
  const text = String(actionText).trim();

  // 예: "다나에게 1발 사용", "다나에게 공격"
  const match = text.match(/^(.+?)에게(?:\s|$)/);

  if (match?.[1]) {
    return match[1].trim();
  }

  return "";
}

function ShotHistoryCard({ action }) {
  const targetName = parseTargetName(action.action_text);

  return (
    <article className="player-shot-item">
      <div className="player-shot-item__top">
        <div className="player-shot-item__people">
          <span className="player-shot-item__shooter">
            익명
          </span>

          <span className="player-shot-item__arrow">→</span>

          <span className="player-shot-item__target">
            {targetName || "대상 미표시"}
          </span>
        </div>

        <span
          className={`player-shot-item__status ${
            action.executed ? "is-done" : "is-waiting"
          }`}
        >
          {action.executed ? "실행 완료" : "실행 대기"}
        </span>
      </div>

      <div className="player-shot-item__content">
        <div className="player-shot-item__bullet">
          <span>💥</span>
          <strong>{Number(action.used_bullets || 0)}발</strong>
        </div>

        <p>{action.action_text || "등록된 텍스트가 없습니다."}</p>
      </div>

      <div className="player-shot-item__bottom">
        <span>{formatDate(action.created_at)}</span>

        {Number(action.delay_seconds || 0) > 0 && (
          <span>딜레이 {action.delay_seconds}초</span>
        )}
      </div>
    </article>
  );
}

export default function PlayerPage() {
  const [players, setPlayers] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [currentPlayerId, setCurrentPlayerId] = useState(
    sessionStorage.getItem("bullet_current_player_id") || ""
  );

  const [loginPlayer, setLoginPlayer] = useState(null);
  const [nickname, setNickname] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [shotAmount, setShotAmount] = useState(1);
  const [shotText, setShotText] = useState("");
  const [shotDelay, setShotDelay] = useState(0);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(window.__playerToastTimer);
    window.__playerToastTimer = window.setTimeout(() => {
      setToast("");
    }, 2600);
  }, []);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        if (!silent) setLoading(true);

        const [playerResult, actionResult] = await Promise.all([
          supabase
            .from("game_players")
            .select(
              "id, real_name, nickname, received_bullets, fired_bullets, hit_bullets, is_active, created_at, updated_at"
            )
            .order("created_at", { ascending: true }),

          supabase
            .from("player_bullet_actions")
            .select(
              "id, created_at, nickname, used_bullets, action_text, delay_seconds, executed, executed_at"
            )
            .order("created_at", { ascending: false })
            .limit(30)
        ]);

        if (playerResult.error) throw playerResult.error;
        if (actionResult.error) throw actionResult.error;

        const nextPlayers = playerResult.data || [];

        setPlayers(nextPlayers);
        setActions(actionResult.data || []);

        if (currentPlayerId) {
          const refreshedPlayer = nextPlayers.find(
            (player) => player.id === currentPlayerId
          );

          if (refreshedPlayer) {
            setLoginPlayer(refreshedPlayer);
          }
        }
      } catch (error) {
        if (!silent) {
          showToast(error.message || "데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [currentPlayerId, showToast]
  );

  useEffect(() => {
    loadData();

    const timer = window.setInterval(() => {
      loadData({ silent: true });
    }, 2000);

    return () => window.clearInterval(timer);
  }, [loadData]);

  const currentPlayer = useMemo(() => {
    return (
      players.find((player) => player.id === currentPlayerId) ||
      loginPlayer
    );
  }, [players, currentPlayerId, loginPlayer]);

  const targets = useMemo(() => {
    return players.filter(
      (player) =>
        player.is_active &&
        player.id !== currentPlayerId
    );
  }, [players, currentPlayerId]);

  async function enterPlayer() {
    const cleanNickname = nickname.trim();

    if (!isSupabaseConfigured || !supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    if (!cleanNickname || !loginPassword) {
      showToast("닉네임과 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "player_password_login",
        {
          p_nickname: cleanNickname,
          p_password: loginPassword
        }
      );

      if (error) throw error;

      const player = data?.player ?? data;

      if (!player?.id) {
        throw new Error("로그인 응답에 플레이어 정보가 없습니다.");
      }

      sessionStorage.setItem(
        "bullet_current_player_id",
        player.id
      );

      setCurrentPlayerId(player.id);
      setLoginPlayer(player);
      setSelectedTargetId("");
      setLoginPassword("");

      await loadData({ silent: true });

      showToast(`${player.nickname}으로 입장했습니다.`);
    } catch (error) {
      showToast(
        error.message ||
          "닉네임 또는 비밀번호가 올바르지 않습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  function leavePlayer() {
    sessionStorage.removeItem("bullet_current_player_id");

    setCurrentPlayerId("");
    setLoginPlayer(null);
    setSelectedTargetId("");
    setShotAmount(1);
    setShotText("");
    setShotDelay(0);
  }

  async function fireBullet() {
    if (!isSupabaseConfigured || !supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const target = players.find(
      (player) => player.id === selectedTargetId
    );

    const amount = Number(shotAmount);
    const delay = Number(shotDelay);

    if (!currentPlayer || !target) {
      showToast("사격 대상을 선택하세요.");
      return;
    }

    if (!Number.isInteger(amount) || amount < 1) {
      showToast("사용 총알은 1 이상의 정수여야 합니다.");
      return;
    }

    if (remaining(currentPlayer) < amount) {
      showToast("남은 총알이 부족합니다.");
      return;
    }

    if (!Number.isFinite(delay) || delay < 0) {
      showToast("딜레이 시간은 0 이상이어야 합니다.");
      return;
    }

    const confirmed = window.confirm(
      `${target.nickname}에게 ${amount}발을 사용하시겠습니까?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const shooterResult = await supabase
        .from("game_players")
        .update({
          fired_bullets:
            Number(currentPlayer.fired_bullets || 0) + amount
        })
        .eq("id", currentPlayer.id);

      if (shooterResult.error) {
        throw shooterResult.error;
      }

      const targetResult = await supabase
        .from("game_players")
        .update({
          hit_bullets:
            Number(target.hit_bullets || 0) + amount
        })
        .eq("id", target.id);

      if (targetResult.error) {
        throw targetResult.error;
      }

      /*
        action_text 앞부분을 항상 "대상닉네임에게"로 저장합니다.
        따라서 별도 DB 컬럼 추가 없이 기록 목록에서
        누가 누구에게 쐈는지 표시할 수 있습니다.
      */
      const customText = shotText.trim();

      const actionText = customText
        ? `${target.nickname}에게 ${customText}`
        : `${target.nickname}에게 ${amount}발 사용`;

      const actionResult = await supabase
        .from("bullet_actions")
        .insert({
          player_id: currentPlayer.id,
          nickname: currentPlayer.nickname,
          used_bullets: amount,
          action_text: actionText,
          delay_seconds: delay,
          executed: false
        });

      if (actionResult.error) {
        throw actionResult.error;
      }

      setSelectedTargetId("");
      setShotAmount(1);
      setShotText("");
      setShotDelay(0);

      await loadData({ silent: true });

      showToast(
        `${target.nickname}에게 ${amount}발을 사용했습니다.`
      );
    } catch (error) {
      showToast(
        error.message || "총알 사용 처리에 실패했습니다."
      );

      await loadData({ silent: true });
    } finally {
      setLoading(false);
    }
  }

  if (!currentPlayer) {
    return (
      <main className="player-page">
        <section className="login-panel card">
          <div className="card-head">
            <div>
              <h2>게임 참가</h2>
              <p>
                관리자가 등록한 닉네임과 개인 비밀번호를
                입력하세요.
              </p>
            </div>
          </div>

          <div className="card-body">
            {!isSupabaseConfigured && (
              <div className="notice">
                Supabase 설정 후 실제 참가가 가능합니다.
              </div>
            )}

            <div className="field">
              <label>닉네임</label>
              <input
                value={nickname}
                onChange={(event) =>
                  setNickname(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") enterPlayer();
                }}
                placeholder="예: 여리"
              />
            </div>

            <div className="field login-password-field">
              <label>개인 비밀번호</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) =>
                  setLoginPassword(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") enterPlayer();
                }}
                placeholder="관리자에게 받은 비밀번호"
                autoComplete="current-password"
              />
            </div>

            <button
              className="btn primary full-button"
              disabled={loading}
              onClick={enterPlayer}
            >
              {loading ? "입장 중..." : "입장하기"}
            </button>
          </div>
        </section>

        {toast && <div className="toast show">{toast}</div>}
      </main>
    );
  }

  return (
    <main className="player-page">
      <section className="player-shell">
        <div className="card player-hero">
          <div className="hero-row">
            <div>
              <span className="pill good">게임 참가 중</span>
              <h2>{currentPlayer.nickname}</h2>
              <p>상대를 선택하고 총알을 사용하세요.</p>
            </div>

            <button
              className="btn ghost"
              onClick={leavePlayer}
            >
              나가기
            </button>
          </div>

          <div className="player-metrics">
            <div className="metric">
              <span>남은 장탄수</span>
              <strong>{remaining(currentPlayer)}발</strong>
            </div>

            <div className="metric">
              <span>누적 피격</span>
              <strong>
                {currentPlayer.hit_bullets || 0}회
              </strong>
            </div>
          </div>
        </div>

        <div className="card shoot-zone">
          <div className="card-head inner-head">
            <div>
              <h2>사격 대상 선택</h2>
              <p>
                본인을 제외한 활성 참가자만 표시됩니다.
              </p>
            </div>
          </div>

          <div className="target-grid">
            {targets.length === 0 ? (
              <div className="empty">
                사격 가능한 대상이 없습니다.
              </div>
            ) : (
              targets.map((target) => (
                <button
                  key={target.id}
                  className={`target ${
                    selectedTargetId === target.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedTargetId(target.id)
                  }
                >
                  <strong>{target.nickname}</strong>
                  <small>
                    피격 {target.hit_bullets || 0}회
                  </small>
                </button>
              ))
            )}
          </div>

          <div className="form-grid shot-form">
            <div className="field">
              <label>사용 총알</label>
              <input
                type="number"
                min="1"
                value={shotAmount}
                onChange={(event) =>
                  setShotAmount(event.target.value)
                }
              />
            </div>

            <div className="field">
              <label>딜레이 시간(초)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={shotDelay}
                onChange={(event) =>
                  setShotDelay(event.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>텍스트</label>
              <input
                value={shotText}
                onChange={(event) =>
                  setShotText(event.target.value)
                }
                placeholder="예: 기습 공격"
              />
            </div>
          </div>

          <button
            className="btn primary full-button"
            disabled={
              loading ||
              !selectedTargetId ||
              Number(shotAmount) < 1 ||
              remaining(currentPlayer) < Number(shotAmount)
            }
            onClick={fireBullet}
          >
            {loading
              ? "처리 중..."
              : "선택한 대상에게 총알 사용"}
          </button>
        </div>

        <section className="card player-shot-history">
          <div className="card-head">
            <div>
              <h2>최근 사격 기록</h2>
              <p>
                누가 누구에게 총알을 사용했는지 실시간으로
                확인할 수 있습니다.
              </p>
            </div>

            <span className="pill">
              최근 {actions.length}건
            </span>
          </div>

          <div className="card-body">
            {actions.length === 0 ? (
              <div className="empty">
                아직 사격 기록이 없습니다.
              </div>
            ) : (
              <div className="player-shot-list">
                {actions.map((action) => (
                  <ShotHistoryCard
                    key={action.id}
                    action={action}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </section>

      {toast && <div className="toast show">{toast}</div>}
    </main>
  );
}
