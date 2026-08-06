import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  supabase,
  isSupabaseConfigured
} from "../lib/supabase";

const cyberColors = {
  background: "#08020f",
  panel: "#15071f",
  panelLight: "#210b2e",
  pink: "#ff2fb3",
  pinkLight: "#ff78d8",
  purple: "#d500ff",
  text: "#ffffff",
  muted: "rgba(255, 255, 255, 0.62)",
  border: "rgba(255, 57, 191, 0.35)"
};

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

function CyberGridOverlay() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.08,
          backgroundImage:
            "linear-gradient(rgba(255, 47, 179, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 47, 179, 0.5) 1px, transparent 1px)",
          backgroundSize: "28px 28px"
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.08,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 4px, rgba(255,255,255,0.18) 5px)"
        }}
      />
    </>
  );
}

function CyberpunkButton({
  children,
  onClick,
  disabled = false,
  full = false,
  type = "button"
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        position: "relative",
        width: full ? "100%" : "auto",
        minHeight: "52px",
        padding: "13px 18px",
        overflow: "hidden",
        border: `1px solid ${
          disabled
            ? "rgba(255, 120, 216, 0.25)"
            : cyberColors.pinkLight
        }`,
        borderRadius: "12px",
        background: disabled
          ? "linear-gradient(135deg, #4e1b43, #32102e)"
          : "linear-gradient(135deg, #ff168f 0%, #ff2fb3 48%, #d500ff 100%)",
        boxShadow: disabled
          ? "none"
          : "0 0 8px rgba(255,47,179,0.85), 0 0 22px rgba(255,0,183,0.48), inset 0 0 14px rgba(255,255,255,0.18)",
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: 900,
        letterSpacing: "0.06em",
        textShadow:
          "0 0 8px rgba(255,255,255,0.65)",
        cursor: disabled
          ? "not-allowed"
          : "pointer",
        opacity: disabled ? 0.58 : 1,
        transition:
          "transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease"
      }}
      onMouseEnter={(event) => {
        if (disabled) return;

        event.currentTarget.style.transform =
          "translateY(-2px)";

        event.currentTarget.style.filter =
          "brightness(1.13) saturate(1.18)";

        event.currentTarget.style.boxShadow =
          "0 0 12px rgba(255,47,179,1), 0 0 34px rgba(255,0,183,0.82), 0 0 50px rgba(213,0,255,0.36), inset 0 0 16px rgba(255,255,255,0.22)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          "translateY(0)";

        event.currentTarget.style.filter =
          "none";

        event.currentTarget.style.boxShadow =
          disabled
            ? "none"
            : "0 0 8px rgba(255,47,179,0.85), 0 0 22px rgba(255,0,183,0.48), inset 0 0 14px rgba(255,255,255,0.18)";
      }}
      onMouseDown={(event) => {
        if (disabled) return;

        event.currentTarget.style.transform =
          "translateY(1px) scale(0.99)";
      }}
      onMouseUp={(event) => {
        if (disabled) return;

        event.currentTarget.style.transform =
          "translateY(-2px)";
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          width: "84%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, #ffffff, transparent)",
          boxShadow: "0 0 8px #ffffff"
        }}
      />

      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0, transparent 9px, rgba(255,255,255,0.5) 10px, transparent 11px)"
        }}
      />

      <span
        style={{
          position: "relative",
          zIndex: 1
        }}
      >
        {children}
      </span>
    </button>
  );
}

function CyberpunkGhostButton({
  children,
  onClick,
  disabled = false
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minHeight: "40px",
        padding: "9px 14px",
        border:
          "1px solid rgba(255,92,205,0.46)",
        borderRadius: "10px",
        background:
          "rgba(255,47,179,0.08)",
        color: cyberColors.pinkLight,
        fontSize: "13px",
        fontWeight: 800,
        cursor: disabled
          ? "not-allowed"
          : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow:
          "inset 0 0 12px rgba(255,47,179,0.08)",
        transition:
          "background 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease"
      }}
      onMouseEnter={(event) => {
        if (disabled) return;

        event.currentTarget.style.background =
          "rgba(255,47,179,0.18)";

        event.currentTarget.style.boxShadow =
          "0 0 18px rgba(255,47,179,0.25)";

        event.currentTarget.style.transform =
          "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background =
          "rgba(255,47,179,0.08)";

        event.currentTarget.style.boxShadow =
          "inset 0 0 12px rgba(255,47,179,0.08)";

        event.currentTarget.style.transform =
          "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}

function CyberpunkInput({
  value,
  onChange,
  onKeyDown,
  type = "text",
  placeholder,
  min,
  autoComplete
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoComplete={autoComplete}
      style={{
        width: "100%",
        minHeight: "50px",
        padding: "12px 14px",
        outline: "none",
        border:
          "1px solid rgba(255,74,194,0.28)",
        borderRadius: "11px",
        background:
          "rgba(7,2,15,0.78)",
        color: "#ffffff",
        fontSize: "15px",
        boxSizing: "border-box",
        boxShadow:
          "inset 0 0 14px rgba(0,0,0,0.42)",
        transition:
          "border-color 0.16s ease, box-shadow 0.16s ease"
      }}
      onFocus={(event) => {
        event.currentTarget.style.borderColor =
          cyberColors.pink;

        event.currentTarget.style.boxShadow =
          "0 0 0 3px rgba(255,47,179,0.12), 0 0 18px rgba(255,47,179,0.18), inset 0 0 14px rgba(0,0,0,0.42)";
      }}
      onBlur={(event) => {
        event.currentTarget.style.borderColor =
          "rgba(255,74,194,0.28)";

        event.currentTarget.style.boxShadow =
          "inset 0 0 14px rgba(0,0,0,0.42)";
      }}
    />
  );
}

function ShotHistoryCard({ action }) {
  const targetName =
    action.target_nickname || "대상 미표시";

  return (
    <article
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "16px",
        border:
          "1px solid rgba(255,58,190,0.25)",
        borderRadius: "15px",
        background:
          "linear-gradient(145deg, rgba(31,8,42,0.96), rgba(13,4,23,0.98))",
        boxShadow:
          "0 12px 28px rgba(0,0,0,0.24)"
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: "15%",
          bottom: "15%",
          width: "3px",
          borderRadius: "999px",
          background:
            "linear-gradient(#ff2fb3, #d500ff)",
          boxShadow:
            "0 0 12px rgba(255,47,179,0.9)"
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0
          }}
        >
          <span
            style={{
              color: cyberColors.muted,
              fontWeight: 800
            }}
          >
            익명
          </span>

          <span
            style={{
              color: cyberColors.pink
            }}
          >
            →
          </span>

          <strong
            style={{
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {targetName}
          </strong>
        </div>

        <span
          style={{
            flexShrink: 0,
            padding: "5px 8px",
            borderRadius: "999px",
            border: `1px solid ${
              action.executed
                ? "rgba(74,255,176,0.4)"
                : "rgba(255,77,198,0.4)"
            }`,
            background: action.executed
              ? "rgba(74,255,176,0.1)"
              : "rgba(255,47,179,0.1)",
            color: action.executed
              ? "#65ffc0"
              : "#ff79da",
            fontSize: "10px",
            fontWeight: 900
          }}
        >
          {action.executed
            ? "실행 완료"
            : "실행 대기"}
        </span>
      </div>

      <div
        style={{
          marginTop: "14px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px"
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "8px 10px",
            borderRadius: "10px",
            background:
              "rgba(255,47,179,0.1)",
            color: cyberColors.pinkLight
          }}
        >
          <span>💥</span>

          <strong>
            {Number(action.used_bullets || 0)}발
          </strong>
        </div>

        <p
          style={{
            margin: 0,
            color:
              "rgba(255,255,255,0.78)",
            fontSize: "14px",
            lineHeight: 1.6,
            wordBreak: "break-word"
          }}
        >
          {action.action_text ||
            "등록된 텍스트가 없습니다."}
        </p>
      </div>

      <div
        style={{
          marginTop: "13px",
          color:
            "rgba(255,255,255,0.38)",
          fontSize: "11px",
          textAlign: "right"
        }}
      >
        {formatDate(action.created_at)}
      </div>
    </article>
  );
}

function MyLogCard({ action }) {
  return (
    <article
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "15px",
        border:
          "1px solid rgba(255,58,190,0.25)",
        borderRadius: "14px",
        background:
          "linear-gradient(145deg, rgba(31,8,42,0.96), rgba(13,4,23,0.98))"
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "15%",
          bottom: "15%",
          left: 0,
          width: "3px",
          borderRadius: "999px",
          background:
            "linear-gradient(#ff2fb3, #d500ff)",
          boxShadow:
            "0 0 12px rgba(255,47,179,0.9)"
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px"
        }}
      >
        <div>
          <span
            style={{
              display: "block",
              marginBottom: "4px",
              color:
                "rgba(255,255,255,0.45)",
              fontSize: "10px"
            }}
          >
            TARGET
          </span>

          <strong
            style={{
              color: cyberColors.pinkLight,
              fontSize: "16px"
            }}
          >
            {action.target_nickname ||
              "대상 미표시"}
          </strong>
        </div>

        <span
          style={{
            flexShrink: 0,
            padding: "5px 8px",
            borderRadius: "999px",
            border: `1px solid ${
              action.executed
                ? "rgba(74,255,176,0.4)"
                : "rgba(255,77,198,0.4)"
            }`,
            background: action.executed
              ? "rgba(74,255,176,0.1)"
              : "rgba(255,47,179,0.1)",
            color: action.executed
              ? "#65ffc0"
              : "#ff79da",
            fontSize: "10px",
            fontWeight: 900
          }}
        >
          {action.executed
            ? "실행 완료"
            : "실행 대기"}
        </span>
      </div>

      <div
        style={{
          marginTop: "13px",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px"
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: "8px 10px",
            borderRadius: "10px",
            background:
              "rgba(255,47,179,0.1)",
            color: cyberColors.pinkLight,
            fontWeight: 900
          }}
        >
          💥 {Number(action.used_bullets || 0)}발
        </div>

        <p
          style={{
            margin: 0,
            color:
              "rgba(255,255,255,0.78)",
            fontSize: "13px",
            lineHeight: 1.55,
            wordBreak: "break-word"
          }}
        >
          {action.action_text ||
            "등록된 텍스트가 없습니다."}
        </p>
      </div>

      <div
        style={{
          marginTop: "12px",
          color:
            "rgba(255,255,255,0.38)",
          fontSize: "11px",
          textAlign: "right"
        }}
      >
        {formatDate(action.created_at)}
      </div>
    </article>
  );
}

function WelcomeLoading({
  visible,
  nickname,
  progress
}) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "22px",
        background:
          "radial-gradient(circle at top, rgba(88,15,92,0.98), rgba(7,2,15,0.99))",
        backdropFilter: "blur(12px)"
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(420px, 100%)",
          padding: "34px 24px",
          overflow: "hidden",
          border:
            "1px solid rgba(255,65,196,0.55)",
          borderRadius: "24px",
          background:
            "linear-gradient(145deg, rgba(29,5,38,0.96), rgba(10,3,20,0.98))",
          boxShadow:
            "0 0 26px rgba(255,0,183,0.28), 0 28px 90px rgba(0,0,0,0.58)",
          color: "#ffffff",
          textAlign: "center"
        }}
      >
        <CyberGridOverlay />

        <div
          style={{
            position: "relative",
            zIndex: 1
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              margin: "0 auto 20px",
              display: "grid",
              placeItems: "center",
              border:
                "1px solid rgba(255,130,222,0.86)",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, #ff158f, #d500ff)",
              boxShadow:
                "0 0 18px rgba(255,20,160,0.9), 0 0 42px rgba(213,0,255,0.55)",
              fontSize: "34px"
            }}
          >
            🎯
          </div>

          <div
            style={{
              marginBottom: "8px",
              color: "#ff78d8",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.18em"
            }}
          >
            PLAYER ACCESS GRANTED
          </div>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize:
                "clamp(25px, 7vw, 34px)",
              lineHeight: 1.25,
              textShadow:
                "0 0 14px rgba(255,46,188,0.8)"
            }}
          >
            {nickname}님 환영합니다
          </h2>

          <p
            style={{
              margin: "0 0 25px",
              color:
                "rgba(255,255,255,0.7)",
              fontSize: "14px"
            }}
          >
            게임 시스템에 접속하고 있습니다.
          </p>

          <div
            style={{
              height: "13px",
              overflow: "hidden",
              border:
                "1px solid rgba(255,74,194,0.3)",
              borderRadius: "999px",
              background:
                "rgba(255,255,255,0.08)"
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: "inherit",
                background:
                  "linear-gradient(90deg, #ff167f 0%, #ff47c7 50%, #d600ff 100%)",
                boxShadow:
                  "0 0 12px rgba(255,31,170,1), 0 0 28px rgba(214,0,255,0.7)",
                transition:
                  "width 1.55s cubic-bezier(0.22, 1, 0.36, 1)"
              }}
            />
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              color:
                "rgba(255,255,255,0.64)",
              fontSize: "11px"
            }}
          >
            <span>SYSTEM LOADING</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerPage() {
  const [players, setPlayers] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [currentPlayerId, setCurrentPlayerId] =
    useState(
      sessionStorage.getItem(
        "bullet_current_player_id"
      ) || ""
    );

  const [loginPlayer, setLoginPlayer] =
    useState(null);

  const [nickname, setNickname] =
    useState("");

  const [loginPassword, setLoginPassword] =
    useState("");

  const [welcomeVisible, setWelcomeVisible] =
    useState(false);

  const [welcomeProgress, setWelcomeProgress] =
    useState(0);

  const [welcomeNickname, setWelcomeNickname] =
    useState("");

  const [selectedTargetId, setSelectedTargetId] =
    useState("");

  const [shotAmount, setShotAmount] =
    useState(1);

  const [shotText, setShotText] =
    useState("");

  const [myActions, setMyActions] =
    useState([]);

  const [showMyLogs, setShowMyLogs] =
    useState(false);

  const [myLogsLoading, setMyLogsLoading] =
    useState(false);

  const showToast = useCallback((message) => {
    setToast(message);

    window.clearTimeout(
      window.__playerToastTimer
    );

    window.__playerToastTimer =
      window.setTimeout(() => {
        setToast("");
      }, 2600);
  }, []);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (
        !isSupabaseConfigured ||
        !supabase
      ) {
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        }

        const [
          playerResult,
          actionResult
        ] = await Promise.all([
          supabase
            .from("game_players")
            .select(
              "id, real_name, nickname, received_bullets, fired_bullets, hit_bullets, is_active, created_at, updated_at"
            )
            .order("created_at", {
              ascending: true
            }),

          supabase
            .from("player_bullet_actions")
            .select(
              "id, created_at, nickname, target_nickname, used_bullets, action_text, executed, executed_at"
            )
            .order("created_at", {
              ascending: false
            })
            .limit(1)
        ]);

        if (playerResult.error) {
          throw playerResult.error;
        }

        if (actionResult.error) {
          throw actionResult.error;
        }

        const nextPlayers =
          playerResult.data || [];

        setPlayers(nextPlayers);
        setActions(actionResult.data || []);

        if (currentPlayerId) {
          const refreshedPlayer =
            nextPlayers.find(
              (player) =>
                player.id === currentPlayerId
            );

          if (refreshedPlayer) {
            setLoginPlayer(refreshedPlayer);
          } else {
            sessionStorage.removeItem(
              "bullet_current_player_id"
            );

            setCurrentPlayerId("");
            setLoginPlayer(null);
            setMyActions([]);
            setShowMyLogs(false);
          }
        }
      } catch (error) {
        if (!silent) {
          showToast(
            error.message ||
              "데이터를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [currentPlayerId, showToast]
  );

  useEffect(() => {
    loadData();

    const timer = window.setInterval(() => {
      loadData({ silent: true });
    }, 2000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadData]);

  useEffect(() => {
    if (!welcomeVisible) {
      return undefined;
    }

    setWelcomeProgress(0);

    const progressTimer =
      window.setTimeout(() => {
        setWelcomeProgress(100);
      }, 80);

    const closeTimer =
      window.setTimeout(() => {
        setWelcomeVisible(false);
        setWelcomeProgress(0);
      }, 1900);

    return () => {
      window.clearTimeout(progressTimer);
      window.clearTimeout(closeTimer);
    };
  }, [welcomeVisible]);

  useEffect(() => {
    setMyActions([]);
    setShowMyLogs(false);
  }, [currentPlayerId]);

  const currentPlayer = useMemo(() => {
    return (
      players.find(
        (player) =>
          player.id === currentPlayerId
      ) || loginPlayer
    );
  }, [
    players,
    currentPlayerId,
    loginPlayer
  ]);

  const targets = useMemo(() => {
    return players.filter(
      (player) =>
        player.is_active &&
        player.id !== currentPlayerId
    );
  }, [players, currentPlayerId]);

  async function enterPlayer() {
    const cleanNickname = nickname.trim();

    if (
      !isSupabaseConfigured ||
      !supabase
    ) {
      showToast(
        "Supabase 설정이 필요합니다."
      );
      return;
    }

    if (!cleanNickname || !loginPassword) {
      showToast(
        "닉네임과 비밀번호를 입력하세요."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.rpc(
          "player_password_login",
          {
            p_nickname: cleanNickname,
            p_password: loginPassword
          }
        );

      if (error) {
        throw error;
      }

      const player =
        data?.player ?? data;

      if (!player?.id) {
        throw new Error(
          "로그인 응답에 플레이어 정보가 없습니다."
        );
      }

      sessionStorage.setItem(
        "bullet_current_player_id",
        player.id
      );

      setMyActions([]);
      setShowMyLogs(false);

      setCurrentPlayerId(player.id);
      setLoginPlayer(player);
      setSelectedTargetId("");
      setLoginPassword("");
      setWelcomeNickname(player.nickname);
      setWelcomeVisible(true);

      await loadData({
        silent: true
      });
    } catch (error) {
      showToast(
        error.message ||
          "닉네임 또는 비밀번호가 올바르지 않습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMyActions() {
    if (
      !supabase ||
      !currentPlayer?.id
    ) {
      setMyActions([]);
      return;
    }

    const loggedInPlayerId =
      currentPlayer.id;

    setMyLogsLoading(true);
    setMyActions([]);

    try {
      const { data, error } =
        await supabase
          .from("bullet_actions")
          .select(
            "id, created_at, player_id, target_nickname, used_bullets, action_text, executed, executed_at"
          )
          .eq(
            "player_id",
            loggedInPlayerId
          )
          .order("created_at", {
            ascending: false
          })
          .limit(50);

      if (error) {
        throw error;
      }

      /*
       * 서버에서 player_id로 조회한 뒤에도
       * 현재 로그인 플레이어 id와 정확히 같은 기록만
       * 한 번 더 필터링합니다.
       */
      const safeMyActions = (
        data || []
      ).filter(
        (action) =>
          String(action.player_id) ===
          String(loggedInPlayerId)
      );

      /*
       * 조회 중 로그인 계정이 바뀐 경우
       * 이전 계정의 결과를 화면에 넣지 않습니다.
       */
      const storedPlayerId =
        sessionStorage.getItem(
          "bullet_current_player_id"
        );

      if (
        String(storedPlayerId) !==
        String(loggedInPlayerId)
      ) {
        setMyActions([]);
        return;
      }

      setMyActions(safeMyActions);
    } catch (error) {
      setMyActions([]);

      showToast(
        error.message ||
          "내 사격 기록을 불러오지 못했습니다."
      );
    } finally {
      setMyLogsLoading(false);
    }
  }

  async function toggleMyLogs() {
    if (showMyLogs) {
      setShowMyLogs(false);
      setMyActions([]);
      return;
    }

    setShowMyLogs(true);
    await loadMyActions();
  }

  function leavePlayer() {
    sessionStorage.removeItem(
      "bullet_current_player_id"
    );

    setCurrentPlayerId("");
    setLoginPlayer(null);
    setSelectedTargetId("");
    setShotAmount(1);
    setShotText("");
    setWelcomeVisible(false);
    setWelcomeProgress(0);
    setWelcomeNickname("");
    setNickname("");
    setLoginPassword("");
    setShowMyLogs(false);
    setMyActions([]);
    setMyLogsLoading(false);
  }

  async function fireBullet() {
    if (
      !isSupabaseConfigured ||
      !supabase
    ) {
      showToast(
        "Supabase 설정이 필요합니다."
      );
      return;
    }

    const target = players.find(
      (player) =>
        player.id === selectedTargetId
    );

    const amount = Number(shotAmount);

    if (!currentPlayer || !target) {
      showToast(
        "사격 대상을 선택하세요."
      );
      return;
    }

    if (
      !Number.isInteger(amount) ||
      amount < 1
    ) {
      showToast(
        "사용 총알은 1 이상의 정수여야 합니다."
      );
      return;
    }

    if (
      remaining(currentPlayer) < amount
    ) {
      showToast(
        "남은 총알이 부족합니다."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `${target.nickname}에게 ${amount}발을 사용하시겠습니까?`
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const shooterResult =
        await supabase
          .from("game_players")
          .update({
            fired_bullets:
              Number(
                currentPlayer.fired_bullets ||
                  0
              ) + amount
          })
          .eq(
            "id",
            currentPlayer.id
          );

      if (shooterResult.error) {
        throw shooterResult.error;
      }

      const targetResult =
        await supabase
          .from("game_players")
          .update({
            hit_bullets:
              Number(
                target.hit_bullets || 0
              ) + amount
          })
          .eq("id", target.id);

      if (targetResult.error) {
        throw targetResult.error;
      }

      const actionText =
        shotText.trim() ||
        `${amount}발 사용`;

      const actionResult =
        await supabase
          .from("bullet_actions")
          .insert({
            player_id:
              currentPlayer.id,
            nickname:
              currentPlayer.nickname,
            target_nickname:
              target.nickname,
            used_bullets: amount,
            action_text: actionText,
            delay_seconds: 0,
            executed: false
          });

      if (actionResult.error) {
        throw actionResult.error;
      }

      setSelectedTargetId("");
      setShotAmount(1);
      setShotText("");

      await loadData({
        silent: true
      });

      if (showMyLogs) {
        await loadMyActions();
      }

      showToast(
        `${target.nickname}에게 ${amount}발을 사용했습니다.`
      );
    } catch (error) {
      showToast(
        error.message ||
          "총알 사용 처리에 실패했습니다."
      );

      await loadData({
        silent: true
      });
    } finally {
      setLoading(false);
    }
  }

  if (!currentPlayer) {
    return (
      <main
        className="player-page"
        style={{
          minHeight: "100dvh",
          padding: "20px 14px 36px",
          overflowX: "hidden",
          background: `
            radial-gradient(
              circle at top,
              rgba(112,13,104,0.2),
              transparent 40%
            ),
            ${cyberColors.background}
          `
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "500px",
            margin: "0 auto"
          }}
        >
          <section
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "750 / 500",
              overflow: "hidden",
              border:
                "1px solid rgba(255,63,194,0.34)",
              borderRadius: "20px",
              background:
                "linear-gradient(145deg, #16051d, #07020c)",
              boxShadow:
                "0 0 20px rgba(255,0,179,0.14), 0 18px 42px rgba(0,0,0,0.35)"
            }}
          >
            <img
              src="/bgimg.png"
              alt="게임 참가 메인 이미지"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition:
                  "center center"
              }}
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(to bottom, transparent 40%, rgba(7,2,15,0.15) 68%, rgba(7,2,15,0.82) 100%)"
              }}
            />

            <CyberGridOverlay />

            <div
              style={{
                position: "absolute",
                left: "16px",
                right: "16px",
                bottom: "16px",
                zIndex: 2
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "6px 10px",
                  border:
                    "1px solid rgba(255,82,204,0.62)",
                  borderRadius: "999px",
                  background:
                    "rgba(19,3,29,0.72)",
                  color:
                    cyberColors.pinkLight,
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.14em"
                }}
              >
                <span>●</span>
                PLAYER LOGIN
              </span>
            </div>
          </section>

          <section
            style={{
              position: "relative",
              marginTop: "14px",
              overflow: "hidden",
              border:
                "1px solid rgba(255,62,194,0.3)",
              borderRadius: "20px",
              background:
                "linear-gradient(180deg, rgba(25,7,36,0.98), rgba(10,3,18,0.99))",
              boxShadow:
                "0 20px 52px rgba(0,0,0,0.38)"
            }}
          >
            <CyberGridOverlay />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                padding: "23px 19px 21px"
              }}
            >
              <div
                style={{
                  marginBottom: "21px"
                }}
              >
                <div
                  style={{
                    marginBottom: "7px",
                    color:
                      cyberColors.pink,
                    fontSize: "10px",
                    fontWeight: 900,
                    letterSpacing: "0.18em"
                  }}
                >
                  PLAYER AUTHENTICATION
                </div>

                <h1
                  style={{
                    margin: "0 0 7px",
                    color: "#ffffff",
                    fontSize: "25px"
                  }}
                >
                  게임 참가
                </h1>

                <p
                  style={{
                    margin: 0,
                    color:
                      cyberColors.muted,
                    fontSize: "13px",
                    lineHeight: 1.6
                  }}
                >
                  관리자가 등록한 닉네임과 개인
                  비밀번호를 입력하세요.
                </p>
              </div>

              {!isSupabaseConfigured && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "11px 12px",
                    border:
                      "1px solid rgba(255,195,76,0.32)",
                    borderRadius: "10px",
                    background:
                      "rgba(255,195,76,0.08)",
                    color: "#ffd369",
                    fontSize: "12px"
                  }}
                >
                  Supabase 설정 후 실제 참가가
                  가능합니다.
                </div>
              )}

              <div
                style={{
                  marginBottom: "15px"
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    color:
                      "rgba(255,255,255,0.76)",
                    fontSize: "12px",
                    fontWeight: 800
                  }}
                >
                  닉네임
                </label>

                <CyberpunkInput
                  value={nickname}
                  onChange={(event) =>
                    setNickname(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      enterPlayer();
                    }
                  }}
                  placeholder="예: 여리"
                  autoComplete="username"
                />
              </div>

              <div
                style={{
                  marginBottom: "18px"
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    color:
                      "rgba(255,255,255,0.76)",
                    fontSize: "12px",
                    fontWeight: 800
                  }}
                >
                  개인 비밀번호
                </label>

                <CyberpunkInput
                  type="password"
                  value={loginPassword}
                  onChange={(event) =>
                    setLoginPassword(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      enterPlayer();
                    }
                  }}
                  placeholder="관리자에게 받은 비밀번호"
                  autoComplete="current-password"
                />
              </div>

              <CyberpunkButton
                full
                disabled={loading}
                onClick={enterPlayer}
              >
                {loading
                  ? "SYSTEM CONNECTING..."
                  : "▶ 입장하기"}
              </CyberpunkButton>
            </div>
          </section>
        </section>

        {toast && (
          <div className="toast show">
            {toast}
          </div>
        )}
      </main>
    );
  }

  return (
    <main
      className="player-page"
      style={{
        minHeight: "100dvh",
        padding: "18px 12px 38px",
        overflowX: "hidden",
        background: `
          radial-gradient(
            circle at top,
            rgba(121,11,111,0.22),
            transparent 35%
          ),
          ${cyberColors.background}
        `
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "620px",
          margin: "0 auto"
        }}
      >
        {/* 플레이어 정보 */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "20px",
            border:
              "1px solid rgba(255,62,194,0.34)",
            borderRadius: "20px",
            background:
              "linear-gradient(145deg, rgba(35,8,46,0.98), rgba(12,3,22,0.99))",
            boxShadow:
              "0 0 22px rgba(255,0,183,0.12), 0 18px 48px rgba(0,0,0,0.36)"
          }}
        >
          <CyberGridOverlay />

          <div
            style={{
              position: "relative",
              zIndex: 1
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                  "space-between",
                gap: "14px"
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    border:
                      "1px solid rgba(255,73,198,0.42)",
                    borderRadius: "999px",
                    background:
                      "rgba(255,47,179,0.09)",
                    color:
                      cyberColors.pinkLight,
                    fontSize: "10px",
                    fontWeight: 900,
                    letterSpacing: "0.1em"
                  }}
                >
                  <span>●</span>
                  PLAYER ONLINE
                </span>

                <h1
                  style={{
                    margin: "12px 0 5px",
                    color: "#ffffff",
                    fontSize: "28px",
                    lineHeight: 1.1,
                    textShadow:
                      "0 0 14px rgba(255,47,179,0.55)"
                  }}
                >
                  {currentPlayer.nickname}
                </h1>

                <p
                  style={{
                    margin: 0,
                    color:
                      cyberColors.muted,
                    fontSize: "13px"
                  }}
                >
                  상대를 선택하고 총알을
                  사용하세요.
                </p>
              </div>

              <CyberpunkGhostButton
                onClick={leavePlayer}
              >
                나가기
              </CyberpunkGhostButton>
            </div>

            <div
              style={{
                marginTop: "19px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "8px"
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  padding: "14px 7px",
                  border:
                    "1px solid rgba(255,62,194,0.24)",
                  borderRadius: "14px",
                  background:
                    "rgba(255,47,179,0.07)",
                  textAlign: "center"
                }}
              >
                <span
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color:
                      cyberColors.muted,
                    fontSize: "10px",
                    whiteSpace: "nowrap"
                  }}
                >
                  남은 장탄수
                </span>

                <strong
                  style={{
                    display: "block",
                    color:
                      cyberColors.pinkLight,
                    fontSize:
                      "clamp(17px, 5vw, 22px)",
                    textShadow:
                      "0 0 12px rgba(255,47,179,0.5)"
                  }}
                >
                  {remaining(currentPlayer)}발
                </strong>
              </div>

              <div
                style={{
                  minWidth: 0,
                  padding: "14px 7px",
                  border:
                    "1px solid rgba(255,79,195,0.27)",
                  borderRadius: "14px",
                  background:
                    "rgba(255,24,143,0.08)",
                  textAlign: "center"
                }}
              >
                <span
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color:
                      cyberColors.muted,
                    fontSize: "10px",
                    whiteSpace: "nowrap"
                  }}
                >
                  이미 쏜 총알
                </span>

                <strong
                  style={{
                    display: "block",
                    color: "#ff4fc3",
                    fontSize:
                      "clamp(17px, 5vw, 22px)",
                    textShadow:
                      "0 0 12px rgba(255,47,179,0.5)"
                  }}
                >
                  {Number(
                    currentPlayer.fired_bullets ||
                      0
                  )}
                  발
                </strong>
              </div>

              <div
                style={{
                  minWidth: 0,
                  padding: "14px 7px",
                  border:
                    "1px solid rgba(213,0,255,0.24)",
                  borderRadius: "14px",
                  background:
                    "rgba(213,0,255,0.07)",
                  textAlign: "center"
                }}
              >
                <span
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color:
                      cyberColors.muted,
                    fontSize: "10px",
                    whiteSpace: "nowrap"
                  }}
                >
                  누적 피격
                </span>

                <strong
                  style={{
                    display: "block",
                    color: "#e879ff",
                    fontSize:
                      "clamp(17px, 5vw, 22px)",
                    textShadow:
                      "0 0 12px rgba(213,0,255,0.5)"
                  }}
                >
                  {Number(
                    currentPlayer.hit_bullets ||
                      0
                  )}
                  회
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 사격 대상 */}
        <section
          style={{
            position: "relative",
            marginTop: "14px",
            overflow: "hidden",
            padding: "20px",
            border:
              "1px solid rgba(255,62,194,0.28)",
            borderRadius: "20px",
            background:
              "linear-gradient(145deg, rgba(27,7,38,0.98), rgba(11,3,20,0.99))",
            boxShadow:
              "0 18px 45px rgba(0,0,0,0.32)"
          }}
        >
          <CyberGridOverlay />

          <div
            style={{
              position: "relative",
              zIndex: 1
            }}
          >
            <div
              style={{
                marginBottom: "18px"
              }}
            >
              <div
                style={{
                  color:
                    cyberColors.pink,
                  fontSize: "10px",
                  fontWeight: 900,
                  letterSpacing: "0.16em"
                }}
              >
                TARGET SELECT
              </div>

              <h2
                style={{
                  margin: "6px 0 5px",
                  color: "#ffffff",
                  fontSize: "21px"
                }}
              >
                사격 대상 선택
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    cyberColors.muted,
                  fontSize: "12px"
                }}
              >
                본인을 제외한 활성 참가자만
                표시됩니다.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "9px"
              }}
            >
              {targets.length === 0 ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "24px 14px",
                    border:
                      "1px dashed rgba(255,61,192,0.24)",
                    borderRadius: "13px",
                    color:
                      cyberColors.muted,
                    textAlign: "center",
                    fontSize: "13px"
                  }}
                >
                  사격 가능한 대상이 없습니다.
                </div>
              ) : (
                targets.map((target) => {
                  const selected =
                    selectedTargetId ===
                    target.id;

                  return (
                    <button
                      type="button"
                      key={target.id}
                      onClick={() =>
                        setSelectedTargetId(
                          target.id
                        )
                      }
                      style={{
                        minHeight: "70px",
                        padding: "12px",
                        border: selected
                          ? `1px solid ${cyberColors.pinkLight}`
                          : "1px solid rgba(255,62,194,0.2)",
                        borderRadius: "13px",
                        background: selected
                          ? "linear-gradient(145deg, rgba(255,47,179,0.2), rgba(213,0,255,0.14))"
                          : "rgba(255,255,255,0.025)",
                        color: "#ffffff",
                        textAlign: "left",
                        cursor: "pointer",
                        boxShadow: selected
                          ? "0 0 18px rgba(255,47,179,0.3)"
                          : "none"
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          marginBottom: "5px",
                          color: selected
                            ? cyberColors.pinkLight
                            : "#ffffff",
                          fontSize: "15px"
                        }}
                      >
                        {target.nickname}
                      </strong>

                      <small
                        style={{
                          color:
                            "rgba(255,255,255,0.45)",
                          fontSize: "11px"
                        }}
                      >
                        피격{" "}
                        {target.hit_bullets ||
                          0}
                        회
                      </small>
                    </button>
                  );
                })
              )}
            </div>

            <div
              style={{
                marginTop: "18px",
                display: "grid",
                gap: "14px"
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    color:
                      "rgba(255,255,255,0.72)",
                    fontSize: "12px",
                    fontWeight: 800
                  }}
                >
                  사용 총알
                </label>

                <CyberpunkInput
                  type="number"
                  min="1"
                  value={shotAmount}
                  onChange={(event) =>
                    setShotAmount(
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    color:
                      "rgba(255,255,255,0.72)",
                    fontSize: "12px",
                    fontWeight: 800
                  }}
                >
                  텍스트
                </label>

                <CyberpunkInput
                  value={shotText}
                  onChange={(event) =>
                    setShotText(
                      event.target.value
                    )
                  }
                  placeholder="예: 기습 공격"
                />
              </div>

              <CyberpunkButton
                full
                disabled={
                  loading ||
                  !selectedTargetId ||
                  Number(shotAmount) < 1 ||
                  remaining(currentPlayer) <
                    Number(shotAmount)
                }
                onClick={fireBullet}
              >
                {loading
                  ? "PROCESSING..."
                  : "선택한 대상에게 총알 사용"}
              </CyberpunkButton>
            </div>
          </div>
        </section>

        {/* 공개 최신 기록 */}
        <section
          style={{
            position: "relative",
            marginTop: "14px",
            overflow: "hidden",
            padding: "20px",
            border:
              "1px solid rgba(255,62,194,0.26)",
            borderRadius: "20px",
            background:
              "linear-gradient(145deg, rgba(25,6,35,0.98), rgba(10,3,18,0.99))",
            boxShadow:
              "0 18px 45px rgba(0,0,0,0.32)"
          }}
        >
          <CyberGridOverlay />

          <div
            style={{
              position: "relative",
              zIndex: 1
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                  "space-between",
                gap: "12px",
                marginBottom: "17px"
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      cyberColors.pink,
                    fontSize: "10px",
                    fontWeight: 900,
                    letterSpacing: "0.16em"
                  }}
                >
                  LATEST LOG
                </div>

                <h2
                  style={{
                    margin: "6px 0 5px",
                    color: "#ffffff",
                    fontSize: "21px"
                  }}
                >
                  최근 사격 기록
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      cyberColors.muted,
                    fontSize: "12px",
                    lineHeight: 1.5
                  }}
                >
                  가장 최근 사격 기록 1개만
                  표시됩니다.
                </p>
              </div>

              <span
                style={{
                  flexShrink: 0,
                  padding: "6px 9px",
                  border:
                    "1px solid rgba(255,72,198,0.35)",
                  borderRadius: "999px",
                  background:
                    "rgba(255,47,179,0.08)",
                  color:
                    cyberColors.pinkLight,
                  fontSize: "10px",
                  fontWeight: 900
                }}
              >
                최근 {actions.length}건
              </span>
            </div>

            {actions.length === 0 ? (
              <div
                style={{
                  padding: "28px 14px",
                  border:
                    "1px dashed rgba(255,61,192,0.23)",
                  borderRadius: "13px",
                  color:
                    cyberColors.muted,
                  textAlign: "center",
                  fontSize: "13px"
                }}
              >
                아직 사격 기록이 없습니다.
              </div>
            ) : (
              actions
                .slice(0, 1)
                .map((action) => (
                  <ShotHistoryCard
                    key={action.id}
                    action={action}
                  />
                ))
            )}
          </div>
        </section>

        {/* 본인 전용 로그 */}
        <section
          style={{
            position: "relative",
            marginTop: "14px",
            overflow: "hidden",
            padding: "20px",
            border:
              "1px solid rgba(255,62,194,0.26)",
            borderRadius: "20px",
            background:
              "linear-gradient(145deg, rgba(25,6,35,0.98), rgba(10,3,18,0.99))",
            boxShadow:
              "0 18px 45px rgba(0,0,0,0.32)"
          }}
        >
          <CyberGridOverlay />

          <div
            style={{
              position: "relative",
              zIndex: 1
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "12px"
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      cyberColors.pink,
                    fontSize: "10px",
                    fontWeight: 900,
                    letterSpacing: "0.16em"
                  }}
                >
                  PERSONAL LOG
                </div>

                <h2
                  style={{
                    margin: "6px 0 5px",
                    color: "#ffffff",
                    fontSize: "21px"
                  }}
                >
                  내 사격 기록
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      cyberColors.muted,
                    fontSize: "12px",
                    lineHeight: 1.5
                  }}
                >
                  현재 로그인한 플레이어가 직접
                  사용한 기록만 표시됩니다.
                </p>
              </div>

              <CyberpunkGhostButton
                disabled={myLogsLoading}
                onClick={toggleMyLogs}
              >
                {myLogsLoading
                  ? "불러오는 중..."
                  : showMyLogs
                    ? "내 로그 닫기"
                    : "내 로그 보기"}
              </CyberpunkGhostButton>
            </div>

            {showMyLogs && (
              <div
                style={{
                  marginTop: "18px"
                }}
              >
                {myLogsLoading ? (
                  <div
                    style={{
                      padding: "28px 14px",
                      border:
                        "1px dashed rgba(255,61,192,0.23)",
                      borderRadius: "13px",
                      color:
                        cyberColors.muted,
                      textAlign: "center",
                      fontSize: "13px"
                    }}
                  >
                    내 기록을 불러오고 있습니다.
                  </div>
                ) : myActions.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 14px",
                      border:
                        "1px dashed rgba(255,61,192,0.23)",
                      borderRadius: "13px",
                      color:
                        cyberColors.muted,
                      textAlign: "center",
                      fontSize: "13px"
                    }}
                  >
                    아직 내가 사용한 총알 기록이
                    없습니다.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "10px"
                    }}
                  >
                    {myActions.map(
                      (action) => (
                        <MyLogCard
                          key={action.id}
                          action={action}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </section>

      <WelcomeLoading
        visible={welcomeVisible}
        nickname={welcomeNickname}
        progress={welcomeProgress}
      />

      {toast && (
        <div className="toast show">
          {toast}
        </div>
      )}
    </main>
  );
}