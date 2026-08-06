import React, { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { Stat, Toast } from "../components/Common";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "1234";

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

export default function AdminPage() {
  const [players, setPlayers] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [loggedIn, setLoggedIn] = useState(
    sessionStorage.getItem("bullet_admin_logged_in") === "true"
  );

  const [password, setPassword] = useState("");
  const [delayMin, setDelayMin] = useState(0);
  const [delayMax, setDelayMax] = useState(5);

  const [newPlayer, setNewPlayer] = useState({
    real_name: "",
    nickname: "",
    login_password: "",
    received_bullets: 5
  });

  const showToast = useCallback((message) => {
    setToast(message);

    clearTimeout(window.__adminToastTimer);

    window.__adminToastTimer = setTimeout(() => {
      setToast("");
    }, 2600);
  }, []);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!isSupabaseConfigured || !supabase) {
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        }

        const [
          playerResult,
          actionResult,
          delaySettingResult
        ] = await Promise.all([
          supabase
            .from("game_players")
            .select(
              "id, real_name, nickname, received_bullets, fired_bullets, hit_bullets, is_active, created_at, updated_at"
            )
            .order("created_at", { ascending: true }),

          supabase
            .from("bullet_actions")
            .select(
              "id, created_at, nickname, target_nickname, used_bullets, action_text, delay_seconds, executed, executed_at"
            )
            .order("created_at", { ascending: false })
            .limit(100),

          supabase
            .from("bullet_delay_settings")
            .select("min_delay_seconds, max_delay_seconds")
            .eq("id", 1)
            .maybeSingle()
        ]);

        if (playerResult.error) {
          throw playerResult.error;
        }

        if (actionResult.error) {
          throw actionResult.error;
        }

        if (delaySettingResult.error) {
          throw delaySettingResult.error;
        }

        setPlayers(playerResult.data || []);
        setActions(actionResult.data || []);

        if (!silent && delaySettingResult.data) {
          setDelayMin(
            delaySettingResult.data.min_delay_seconds ?? 0
          );

          setDelayMax(
            delaySettingResult.data.max_delay_seconds ?? 0
          );
        }
      } catch (error) {
        if (!silent) {
          showToast(
            error.message || "데이터를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!loggedIn) {
      return undefined;
    }

    loadData();

    const timer = setInterval(() => {
      loadData({ silent: true });
    }, 2000);

    return () => {
      clearInterval(timer);
    };
  }, [loadData, loggedIn]);

  const stats = useMemo(() => {
    return {
      players: players.filter(
        (player) => player.is_active
      ).length,

      remaining: players.reduce(
        (sum, player) => sum + remaining(player),
        0
      ),

      hits: players.reduce(
        (sum, player) =>
          sum + Number(player.hit_bullets || 0),
        0
      ),

      actions: actions.length
    };
  }, [players, actions]);

  function loginAdmin() {
    if (password !== ADMIN_PASSWORD) {
      showToast("관리자 비밀번호가 올바르지 않습니다.");
      return;
    }

    sessionStorage.setItem(
      "bullet_admin_logged_in",
      "true"
    );

    setLoggedIn(true);
    setPassword("");

    showToast("관리자 페이지에 입장했습니다.");
  }

  function logoutAdmin() {
    sessionStorage.removeItem(
      "bullet_admin_logged_in"
    );

    setLoggedIn(false);
  }

  async function addPlayer() {
    if (!isSupabaseConfigured || !supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const realName = newPlayer.real_name.trim();
    const nickname = newPlayer.nickname.trim();
    const loginPassword = newPlayer.login_password;
    const received = Number(newPlayer.received_bullets);

    if (!realName || !nickname || !loginPassword) {
      showToast(
        "실명, 닉네임, 로그인 비밀번호를 입력하세요."
      );
      return;
    }

    if (loginPassword.length < 4) {
      showToast(
        "로그인 비밀번호는 4자 이상 입력하세요."
      );
      return;
    }

    if (!Number.isInteger(received) || received < 0) {
      showToast(
        "받은 총알은 0 이상의 정수여야 합니다."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.rpc(
        "admin_add_player_with_password",
        {
          p_real_name: realName,
          p_nickname: nickname,
          p_password: loginPassword,
          p_received_bullets: received
        }
      );

      if (error) {
        throw error;
      }

      setNewPlayer({
        real_name: "",
        nickname: "",
        login_password: "",
        received_bullets: 5
      });

      await loadData({ silent: true });

      showToast(`${nickname} 참가자를 추가했습니다.`);
    } catch (error) {
      showToast(
        error.message || "참가자 추가에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function adjustBullets(player, amount) {
    if (!supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const next = Math.max(
      Number(player.fired_bullets || 0),
      Number(player.received_bullets || 0) + amount
    );

    const { error } = await supabase
      .from("game_players")
      .update({
        received_bullets: next
      })
      .eq("id", player.id);

    if (error) {
      showToast(error.message);
      return;
    }

    await loadData({ silent: true });
  }

  async function togglePlayer(player) {
    if (!supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const { error } = await supabase
      .from("game_players")
      .update({
        is_active: !player.is_active
      })
      .eq("id", player.id);

    if (error) {
      showToast(error.message);
      return;
    }

    await loadData({ silent: true });

    showToast(
      player.is_active
        ? `${player.nickname} 플레이어를 비활성화했습니다.`
        : `${player.nickname} 플레이어를 활성화했습니다.`
    );
  }

  async function deletePlayer(player) {
    if (!supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const confirmed = window.confirm(
      `${player.real_name}(${player.nickname}) 플레이어를 삭제하시겠습니까?\n\n플레이어의 총알 기록도 함께 삭제되며 복구할 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("game_players")
        .delete()
        .eq("id", player.id);

      if (error) {
        throw error;
      }

      setPlayers((previousPlayers) =>
        previousPlayers.filter(
          (item) => item.id !== player.id
        )
      );

      showToast(
        `${player.nickname} 플레이어를 삭제했습니다.`
      );
    } catch (error) {
      showToast(
        error.message || "플레이어 삭제에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveFutureDelayRange() {
    if (!supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const min = Number(delayMin);
    const max = Number(delayMax);

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max)
    ) {
      showToast(
        "최소값과 최대값에 올바른 숫자를 입력하세요."
      );
      return;
    }

    if (min < 0 || max < 0) {
      showToast("딜레이는 0 이상이어야 합니다.");
      return;
    }

    if (min > max) {
      showToast(
        "최소값은 최대값보다 클 수 없습니다."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bullet_delay_settings")
        .upsert(
          {
            id: 1,
            min_delay_seconds: min,
            max_delay_seconds: max,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "id"
          }
        );

      if (error) {
        throw error;
      }

      showToast(
        `앞으로 들어오는 목록에 ${min}초~${max}초 랜덤 딜레이가 적용됩니다.`
      );
    } catch (error) {
      showToast(
        error.message ||
          "딜레이 설정 저장에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function markExecuted(action) {
    if (!supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const next = !action.executed;

    const { error } = await supabase
      .from("bullet_actions")
      .update({
        executed: next,
        executed_at: next
          ? new Date().toISOString()
          : null
      })
      .eq("id", action.id);

    if (error) {
      showToast(error.message);
      return;
    }

    await loadData({ silent: true });
  }

  async function deleteAction(action) {
    if (!supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const actionName = `${
      action.nickname || "알 수 없음"
    }님의 실행 기록`;

    const confirmed = window.confirm(
      `${actionName}을 삭제하시겠습니까?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bullet_actions")
        .delete()
        .eq("id", action.id);

      if (error) {
        throw error;
      }

      setActions((previousActions) =>
        previousActions.filter(
          (item) => item.id !== action.id
        )
      );

      showToast("총알 실행 기록을 삭제했습니다.");
    } catch (error) {
      showToast(
        error.message ||
          "총알 실행 기록 삭제에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteAllActions() {
    if (!supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    if (actions.length === 0) {
      showToast("삭제할 총알 실행 기록이 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      `총알 실행 목록 ${actions.length}건을 모두 삭제하시겠습니까?\n삭제한 기록은 복구할 수 없습니다.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("bullet_actions")
        .delete()
        .not("id", "is", null);

      if (error) {
        throw error;
      }

      setActions([]);

      showToast("총알 실행 목록을 전체 삭제했습니다.");
    } catch (error) {
      showToast(
        error.message ||
          "총알 실행 목록 전체 삭제에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetGame() {
    if (!supabase) {
      showToast("Supabase 설정이 필요합니다.");
      return;
    }

    const confirmed = window.confirm(
      "받은 총알, 쏜 총알, 남은 총알, 맞은 총알, 총알 실행 목록을 모두 초기화하시겠습니까?\n\n플레이어 자체는 삭제되지 않으며 초기화한 기록은 복구할 수 없습니다."
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const playerResult = await supabase
        .from("game_players")
        .update({
          received_bullets: 0,
          fired_bullets: 0,
          hit_bullets: 0
        })
        .neq(
          "id",
          "00000000-0000-0000-0000-000000000000"
        );

      if (playerResult.error) {
        throw playerResult.error;
      }

      const actionResult = await supabase
        .from("bullet_actions")
        .delete()
        .not("id", "is", null);

      if (actionResult.error) {
        throw actionResult.error;
      }

      await loadData({ silent: true });

      showToast(
        "모든 총알과 게임 기록을 초기화했습니다."
      );
    } catch (error) {
      showToast(
        error.message || "초기화에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <PageHeader type="admin" />

      {!isSupabaseConfigured && (
        <div className="global-warning">
          Supabase 환경변수가 설정되지 않았습니다.
        </div>
      )}

      {!loggedIn ? (
        <section className="login-panel card">
          <div className="card-head">
            <div>
              <h2>관리자 로그인</h2>
              <p>관리자 전용 비밀번호를 입력하세요.</p>
            </div>
          </div>

          <div className="card-body">
            <div className="field">
              <label>관리자 비밀번호</label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loginAdmin();
                  }
                }}
                placeholder="비밀번호"
              />
            </div>

            <button
              className="btn primary full-button"
              onClick={loginAdmin}
            >
              관리자 입장
            </button>
          </div>
        </section>
      ) : (
        <section>
          <div className="stats">
            <Stat
              label="총 참가자"
              value={`${stats.players}명`}
            />

            <Stat
              label="남은 총알"
              value={`${stats.remaining}발`}
            />

            <Stat
              label="누적 피격"
              value={`${stats.hits}회`}
            />

            <Stat
              label="실행 기록"
              value={`${stats.actions}건`}
            />
          </div>

          <div className="grid">
            <div className="stack">
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>참가자 관리</h2>

                    <p>
                      받은 총알, 쏜 총알, 남은 총알,
                      맞은 총알과 플레이어를 관리합니다.
                    </p>
                  </div>

                  <div className="toolbar">
                    <button
                      className="btn danger"
                      disabled={loading}
                      onClick={resetGame}
                    >
                      전체 기록 초기화
                    </button>

                    <button
                      className="btn ghost"
                      onClick={logoutAdmin}
                    >
                      로그아웃
                    </button>
                  </div>
                </div>

                <div className="card-body table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>실명</th>
                        <th>닉네임</th>
                        <th>받은 총알</th>
                        <th>쏜 총알</th>
                        <th>남은 총알</th>
                        <th>맞은 총알</th>
                        <th>상태</th>
                        <th>관리</th>
                      </tr>
                    </thead>

                    <tbody>
                      {players.length === 0 ? (
                        <tr>
                          <td
                            colSpan="8"
                            style={{
                              textAlign: "center"
                            }}
                          >
                            등록된 플레이어가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        players.map((player) => (
                          <tr key={player.id}>
                            <td>
                              <strong>
                                {player.real_name}
                              </strong>
                            </td>

                            <td>{player.nickname}</td>

                            <td>
                              <div className="bullet-control">
                                <button
                                  className="btn ghost compact"
                                  disabled={loading}
                                  onClick={() =>
                                    adjustBullets(player, -1)
                                  }
                                >
                                  -1
                                </button>

                                <strong>
                                  {player.received_bullets}
                                </strong>

                                <button
                                  className="btn ghost compact"
                                  disabled={loading}
                                  onClick={() =>
                                    adjustBullets(player, 1)
                                  }
                                >
                                  +1
                                </button>

                                <button
                                  className="btn ghost compact"
                                  disabled={loading}
                                  onClick={() =>
                                    adjustBullets(player, 5)
                                  }
                                >
                                  +5
                                </button>
                              </div>
                            </td>

                            <td>{player.fired_bullets}</td>

                            <td>{remaining(player)}</td>

                            <td>{player.hit_bullets}</td>

                            <td>
                              <span
                                className={`pill ${
                                  player.is_active
                                    ? "good"
                                    : "bad"
                                }`}
                              >
                                {player.is_active
                                  ? "활성"
                                  : "비활성"}
                              </span>
                            </td>

                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  flexWrap: "wrap"
                                }}
                              >
                                <button
                                  className={`btn compact ${
                                    player.is_active
                                      ? "ghost"
                                      : "success"
                                  }`}
                                  disabled={loading}
                                  onClick={() =>
                                    togglePlayer(player)
                                  }
                                >
                                  {player.is_active
                                    ? "비활성"
                                    : "활성화"}
                                </button>

                                <button
                                  className="btn danger compact"
                                  disabled={loading}
                                  onClick={() =>
                                    deletePlayer(player)
                                  }
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-head admin-action-head">
                  <div>
                    <h2>총알 실행 목록</h2>

                    <p>
                      저장한 범위는 앞으로 새로 들어오는
                      목록에만 적용됩니다.
                    </p>
                  </div>

                  <div className="bulk-delay-panel">
                    <div className="bulk-delay-field">
                      <label>최소 딜레이</label>

                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={delayMin}
                        onChange={(event) =>
                          setDelayMin(event.target.value)
                        }
                      />
                    </div>

                    <span className="bulk-delay-separator">
                      ~
                    </span>

                    <div className="bulk-delay-field">
                      <label>최대 딜레이</label>

                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={delayMax}
                        onChange={(event) =>
                          setDelayMax(event.target.value)
                        }
                      />
                    </div>

                    <button
                      className="btn primary compact"
                      disabled={loading}
                      onClick={saveFutureDelayRange}
                    >
                      앞으로 적용
                    </button>

                    <button
                      className="btn danger compact"
                      disabled={
                        loading || actions.length === 0
                      }
                      onClick={deleteAllActions}
                    >
                      전체 삭제
                    </button>
                  </div>
                </div>

                <div className="card-body table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>시간</th>
                        <th>닉네임</th>
                        <th>사용 총알</th>
                        <th>텍스트</th>
                        <th>대상자 닉네임</th>
                        <th>실행 여부</th>
                        <th>처리</th>
                      </tr>
                    </thead>

                    <tbody>
                      {actions.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            style={{
                              textAlign: "center"
                            }}
                          >
                            총알 실행 기록이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        actions.map((action) => (
                          <tr key={action.id}>
                            <td>
                              {formatDate(
                                action.created_at
                              )}
                            </td>

                            <td>{action.nickname}</td>

                            <td>
                              {action.used_bullets}발
                            </td>

                            <td>
                              {action.action_text}
                            </td>

                            <td>
                              {action.target_nickname || "-"}
                            </td>

                            <td>
                              <span
                                className={`pill ${
                                  action.executed
                                    ? "good"
                                    : "warn"
                                }`}
                              >
                                {action.executed
                                  ? "실행 완료"
                                  : "대기 중"}
                              </span>
                            </td>

                            <td>
                              <div className="action-process-cell">
                                <span className="delay-value">
                                  {Number(
                                    action.delay_seconds || 0
                                  )}
                                  초
                                </span>

                                <button
                                  className={`btn compact ${
                                    action.executed
                                      ? "ghost"
                                      : "success"
                                  }`}
                                  disabled={loading}
                                  onClick={() =>
                                    markExecuted(action)
                                  }
                                >
                                  {action.executed
                                    ? "대기로 변경"
                                    : "실행 완료"}
                                </button>

                                <button
                                  className="btn danger compact"
                                  disabled={loading}
                                  onClick={() =>
                                    deleteAction(action)
                                  }
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card add-card">
              <div className="card-head">
                <div>
                  <h2>참가자 추가</h2>

                  <p>
                    로그인 비밀번호와 초기 총알을
                    등록합니다.
                  </p>
                </div>
              </div>

              <div className="card-body">
                <div className="form-grid">
                  <div className="field full">
                    <label>실명</label>

                    <input
                      value={newPlayer.real_name}
                      onChange={(event) =>
                        setNewPlayer((previous) => ({
                          ...previous,
                          real_name: event.target.value
                        }))
                      }
                      placeholder="예: 여리"
                    />
                  </div>

                  <div className="field full">
                    <label>닉네임</label>

                    <input
                      value={newPlayer.nickname}
                      onChange={(event) =>
                        setNewPlayer((previous) => ({
                          ...previous,
                          nickname: event.target.value
                        }))
                      }
                      placeholder="예: 여리"
                    />
                  </div>

                  <div className="field full">
                    <label>로그인 비밀번호</label>

                    <input
                      type="text"
                      value={newPlayer.login_password}
                      onChange={(event) =>
                        setNewPlayer((previous) => ({
                          ...previous,
                          login_password: event.target.value
                        }))
                      }
                      placeholder="예: 1234 또는 yeri2026"
                      autoComplete="off"
                    />
                  </div>

                  <div className="field full">
                    <label>받은 총알</label>

                    <input
                      type="number"
                      min="0"
                      value={newPlayer.received_bullets}
                      onChange={(event) =>
                        setNewPlayer((previous) => ({
                          ...previous,
                          received_bullets:
                            event.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <button
                  className="btn primary full-button"
                  disabled={loading}
                  onClick={addPlayer}
                >
                  {loading
                    ? "처리 중..."
                    : "참가자 추가"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <Toast message={toast} />
    </div>
  );
}