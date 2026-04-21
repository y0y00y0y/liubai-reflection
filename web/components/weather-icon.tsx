/**
 * WeatherIcon — 手绘涂鸦风格天气图标
 *
 * 使用内联 SVG + stroke 线条模拟手绘感（不规则路径、轻微抖动）。
 * 接口预留：后续可将内部 SVG 替换为 <img src={src} /> 或任意手绘图片，
 * 组件签名（weatherKey + size + className）完全不变。
 *
 * 支持的 weatherKey：sunny | rainy | cloudy | windy | snowy
 */

type WeatherIconProps = {
  weatherKey: string;
  size?: number;
  className?: string;
};

/* ── 各天气 SVG 路径定义 ─────────────────────────────── */

function SunnyIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#d4872a"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 太阳圆心 — 略带手绘感的椭圆 */}
      <path d="M16 10.5 C19.8 10.3 22 13 21.8 16.2 C21.6 19.5 19 21.6 15.8 21.5 C12.5 21.4 10.2 19 10.4 15.8 C10.6 12.6 12.8 10.7 16 10.5 Z" />
      {/* 光芒 — 8 条，长短略有不一，模拟手绘 */}
      <line x1="16" y1="3.5" x2="15.8" y2="7.2" />
      <line x1="16" y1="24.8" x2="16.1" y2="28.3" />
      <line x1="3.5" y1="16" x2="7.1" y2="15.9" />
      <line x1="24.9" y1="16" x2="28.4" y2="16.1" />
      <line x1="7.2" y1="7.4" x2="9.8" y2="10.1" />
      <line x1="22.2" y1="22.1" x2="24.9" y2="24.6" />
      <line x1="24.7" y1="7.3" x2="22.1" y2="9.9" />
      <line x1="7.4" y1="22.2" x2="9.9" y2="24.8" />
    </svg>
  );
}

function RainyIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#5a8fa8"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 云朵 */}
      <path d="M7.5 18 C5.2 17.8 4 16.2 4.2 14.1 C4.4 12.1 6 11 7.8 11.2 C7.5 10.4 7.6 9.2 8.4 8.3 C9.4 7.1 11 6.8 12.3 7.4 C13.1 5.4 15 4.2 17.2 4.5 C20 4.8 21.8 7.2 21.5 10 C23.2 10.1 24.5 11.5 24.3 13.3 C24.1 15 22.6 16.1 20.8 16" />
      <path d="M7.2 18.2 C10 18 20.5 17.8 21.2 18" />
      {/* 雨滴 — 略带角度的短线 */}
      <line x1="9.5" y1="22" x2="8.3" y2="25.8" />
      <line x1="14" y1="21.5" x2="12.8" y2="25.4" />
      <line x1="18.5" y1="22" x2="17.3" y2="25.8" />
      <line x1="23" y1="21.5" x2="21.8" y2="25.4" />
    </svg>
  );
}

function CloudyIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#8a8880"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 后面的云（浅色） */}
      <path
        d="M18 10.5 C16.8 9.2 15.2 8.8 13.5 9.4 C12.2 7.6 10 6.8 7.8 7.6 C5.6 8.4 4.3 10.5 4.6 12.9 C3.2 13.3 2.2 14.5 2.4 16 C2.6 17.5 3.8 18.5 5.3 18.4"
        stroke="#b0aea8"
        strokeWidth="1.4"
      />
      {/* 前面的主云 */}
      <path d="M10.5 22.5 C8 22.3 6.5 20.5 6.8 18.1 C7 16 8.8 14.8 10.8 15.1 C10.5 14.1 10.7 12.8 11.7 11.8 C13 10.5 14.8 10.3 16.2 11.1 C17.2 9 19.3 7.9 21.6 8.3 C24.6 8.8 26.5 11.5 26 14.6 C27.9 14.8 29.3 16.4 29 18.4 C28.7 20.3 27.1 21.5 25.1 21.4 L10.5 21.6" />
    </svg>
  );
}

function WindyIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#7a9e8a"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 风的波浪线 — 三条，长短不一，带手绘感的弯曲 */}
      <path d="M3.5 11 C6 10.2 10 9.5 15 10.5 C19 11.3 21.5 11 23 10 C24.5 9 25.5 7.5 26 6.5" />
      <path d="M3.5 16 C7 15.5 12 15.2 18 16.2 C22 17 25 16.8 27.5 15.5" />
      <path d="M3.5 21 C6.5 20.5 11 20.2 16 21 C19.5 21.6 22 21.2 24.5 20 C26 19.3 27 18.5 27.5 17.5" />
    </svg>
  );
}

function SnowyIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#7baec8"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 雪花主轴 */}
      <line x1="16" y1="4" x2="16" y2="28" />
      <line x1="4" y1="16" x2="28" y2="16" />
      <line x1="7.5" y1="7.5" x2="24.5" y2="24.5" />
      <line x1="24.5" y1="7.5" x2="7.5" y2="24.5" />
      {/* 雪花分枝 — 每轴两侧各一对小枝，略带手绘偏移 */}
      <line x1="16" y1="9" x2="13.2" y2="6.5" />
      <line x1="16" y1="9" x2="18.8" y2="6.5" />
      <line x1="16" y1="23" x2="13.2" y2="25.5" />
      <line x1="16" y1="23" x2="18.8" y2="25.5" />
      <line x1="9" y1="16" x2="6.5" y2="13.2" />
      <line x1="9" y1="16" x2="6.5" y2="18.8" />
      <line x1="23" y1="16" x2="25.5" y2="13.2" />
      <line x1="23" y1="16" x2="25.5" y2="18.8" />
    </svg>
  );
}

/* ── 导出组件 ─────────────────────────────────────────── */

const ICON_MAP: Record<string, (props: { size: number }) => React.JSX.Element> = {
  sunny: SunnyIcon,
  rainy: RainyIcon,
  cloudy: CloudyIcon,
  windy: WindyIcon,
  snowy: SnowyIcon,
};

export function WeatherIcon({ weatherKey, size = 28, className }: WeatherIconProps) {
  const IconComponent = ICON_MAP[weatherKey];
  if (!IconComponent) {
    // 未知天气 key — 占位，保持布局不塌
    return <span style={{ display: "inline-block", width: size, height: size }} className={className} />;
  }
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      <IconComponent size={size} />
    </span>
  );
}
