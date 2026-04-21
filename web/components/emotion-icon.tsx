/**
 * EmotionIcon — 手绘涂鸦风格情绪图标
 *
 * 使用内联 SVG + stroke 线条模拟手绘感，风格与 WeatherIcon 完全一致。
 * 接口预留：后续可将内部 SVG 替换为 <img src={src} /> 或任意手绘图片，
 * 组件签名（emotionKey + size + className）完全不变。
 *
 * 支持的 emotionKey：happy | calm | sad | anxious | angry | tired
 */

type EmotionIconProps = {
  emotionKey: string;
  size?: number;
  className?: string;
};

/* ── 各情绪 SVG 路径定义 ─────────────────────────────── */

function HappyIcon({ size }: { size: number }) {
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
      {/* 脸轮廓 — 略带手绘感的椭圆 */}
      <path d="M16 4.5 C22.4 4.3 27.5 9.5 27.3 16 C27.1 22.5 21.8 27.5 15.8 27.3 C9.5 27.1 4.5 21.8 4.7 15.8 C4.9 9.4 10 4.7 16 4.5 Z" />
      {/* 眼睛 */}
      <path d="M11.5 13 C11.8 12.2 12.6 12 13 12.5 C13.3 13 12.8 13.8 12 13.7" />
      <path d="M19.5 13 C19.8 12.2 20.6 12 21 12.5 C21.3 13 20.8 13.8 20 13.7" />
      {/* 笑嘴 — 上扬弧线 */}
      <path d="M10.5 18 C12 21 20 21 21.5 18" />
    </svg>
  );
}

function CalmIcon({ size }: { size: number }) {
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
      {/* 脸轮廓 */}
      <path d="M16 4.5 C22.4 4.3 27.5 9.5 27.3 16 C27.1 22.5 21.8 27.5 15.8 27.3 C9.5 27.1 4.5 21.8 4.7 15.8 C4.9 9.4 10 4.7 16 4.5 Z" />
      {/* 眼睛 — 平静的半闭眼 */}
      <path d="M11 13.5 C11.5 12.8 12.5 12.8 13 13.5" />
      <path d="M19 13.5 C19.5 12.8 20.5 12.8 21 13.5" />
      {/* 嘴 — 几乎水平的淡淡线条 */}
      <path d="M12 19 C13.5 19.6 18.5 19.6 20 19" />
    </svg>
  );
}

function SadIcon({ size }: { size: number }) {
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
      {/* 脸轮廓 */}
      <path d="M16 4.5 C22.4 4.3 27.5 9.5 27.3 16 C27.1 22.5 21.8 27.5 15.8 27.3 C9.5 27.1 4.5 21.8 4.7 15.8 C4.9 9.4 10 4.7 16 4.5 Z" />
      {/* 眉毛 — 向中间抬起（悲伤眉） */}
      <path d="M10.5 11.5 C11.5 10.2 12.5 10.5 13 11" />
      <path d="M19 11 C19.5 10.5 20.5 10.2 21.5 11.5" />
      {/* 眼睛 */}
      <path d="M11.5 14.5 C12 13.8 13 13.8 13.5 14.5" />
      <path d="M18.5 14.5 C19 13.8 20 13.8 20.5 14.5" />
      {/* 嘴 — 下弯弧线 */}
      <path d="M11 21 C12.5 18.5 19.5 18.5 21 21" />
      {/* 泪滴 */}
      <path d="M13 16.5 C13 18 12 18.5 12.2 17.5" />
    </svg>
  );
}

function AnxiousIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#a87a5a"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 脸轮廓 */}
      <path d="M16 4.5 C22.4 4.3 27.5 9.5 27.3 16 C27.1 22.5 21.8 27.5 15.8 27.3 C9.5 27.1 4.5 21.8 4.7 15.8 C4.9 9.4 10 4.7 16 4.5 Z" />
      {/* 眉毛 — 皱成 "V" 形（紧张眉） */}
      <path d="M10.5 12 C11.5 10.5 12.5 11.5 13 12" />
      <path d="M19 12 C19.5 11.5 20.5 10.5 21.5 12" />
      {/* 眼睛 — 睁大 */}
      <circle cx="12.5" cy="15" r="1.2" />
      <circle cx="19.5" cy="15" r="1.2" />
      {/* 嘴 — 微微张开，波浪形 */}
      <path d="M12 20.5 C13 19 14 20.5 15.5 19.5 C17 18.5 18 20.5 20 20" />
    </svg>
  );
}

function AngryIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="#b06b6b"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 脸轮廓 */}
      <path d="M16 4.5 C22.4 4.3 27.5 9.5 27.3 16 C27.1 22.5 21.8 27.5 15.8 27.3 C9.5 27.1 4.5 21.8 4.7 15.8 C4.9 9.4 10 4.7 16 4.5 Z" />
      {/* 眉毛 — 向下压、向中心倾斜（愤怒眉） */}
      <path d="M10.5 11 C11.5 13 12.5 12 13.5 11.5" />
      <path d="M18.5 11.5 C19.5 12 20.5 13 21.5 11" />
      {/* 眼睛 — 眯着 */}
      <path d="M11 14.5 C11.8 13.8 13.2 13.8 14 14.5" />
      <path d="M18 14.5 C18.8 13.8 20.2 13.8 21 14.5" />
      {/* 嘴 — 紧绷的弧线，两边向下 */}
      <path d="M11.5 21.5 C13 19.5 19 19.5 20.5 21.5" />
    </svg>
  );
}

function TiredIcon({ size }: { size: number }) {
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
      {/* 脸轮廓 */}
      <path d="M16 4.5 C22.4 4.3 27.5 9.5 27.3 16 C27.1 22.5 21.8 27.5 15.8 27.3 C9.5 27.1 4.5 21.8 4.7 15.8 C4.9 9.4 10 4.7 16 4.5 Z" />
      {/* 眼睛 — 沉重的半闭眼皮 */}
      <path d="M11 12.5 C11.8 14 13.2 14 14 12.5" />
      <path d="M11.2 12.8 C12 14 13 14 13.8 13" strokeWidth="2.2" />
      <path d="M18 12.5 C18.8 14 20.2 14 21 12.5" />
      <path d="M18.2 12.8 C19 14 20 14 20.8 13" strokeWidth="2.2" />
      {/* 嘴 — 微微下垂 */}
      <path d="M12.5 20.5 C14 19.5 18 19.5 19.5 20.5" />
      {/* 睡意符号 zzz 右上角 */}
      <path d="M22 7 L24 7 L22 9 L24 9" strokeWidth="1.3" />
    </svg>
  );
}

/* ── 导出组件 ─────────────────────────────────────────── */

const ICON_MAP: Record<string, (props: { size: number }) => React.JSX.Element> = {
  happy: HappyIcon,
  calm: CalmIcon,
  sad: SadIcon,
  anxious: AnxiousIcon,
  angry: AngryIcon,
  tired: TiredIcon,
};

export function EmotionIcon({ emotionKey, size = 28, className }: EmotionIconProps) {
  const IconComponent = ICON_MAP[emotionKey];
  if (!IconComponent) {
    return <span style={{ display: "inline-block", width: size, height: size }} className={className} />;
  }
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
      <IconComponent size={size} />
    </span>
  );
}
