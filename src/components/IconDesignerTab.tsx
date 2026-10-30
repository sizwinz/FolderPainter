import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Code,
  Terminal,
  Database,
  Server,
  Cpu,
  Cloud,
  Bug,
  GitBranch,
  FileText,
  Briefcase,
  Archive,
  Calendar,
  BarChart3,
  Tag,
  Inbox,
  Camera,
  Music,
  Palette,
  Video,
  Paintbrush,
  Gamepad2,
  Sparkles,
  Lock,
  Shield,
  Key,
  Settings,
  Star,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RotateCcw,
  Check,
  Loader2,
  Layers,
  Trash2,
  Maximize2,
  Search,
  X,
  Sliders,
  Smile,
  Image as ImageIcon,
} from "lucide-react";
import { generateDesignedIcon, selectImageDialog, getIconPreviewDataUrl } from "../lib/invoke";
import type { DesignOptions } from "../lib/types";

interface IconDesignerTabProps {
  onSelectDesignedIcon: (iconPath: string, previewUrl: string) => void;
}

interface VectorStickerItem {
  id: string;
  name: string;
  icon: React.ElementType;
}

const BUILTIN_VECTOR_STICKERS: VectorStickerItem[] = [
  { id: "code", name: "Code", icon: Code },
  { id: "terminal", name: "Terminal", icon: Terminal },
  { id: "database", name: "Database", icon: Database },
  { id: "server", name: "Server", icon: Server },
  { id: "cpu", name: "CPU", icon: Cpu },
  { id: "cloud", name: "Cloud", icon: Cloud },
  { id: "git", name: "Git Branch", icon: GitBranch },
  { id: "bug", name: "Bug", icon: Bug },
  { id: "file", name: "Document", icon: FileText },
  { id: "briefcase", name: "Briefcase", icon: Briefcase },
  { id: "archive", name: "Archive", icon: Archive },
  { id: "calendar", name: "Calendar", icon: Calendar },
  { id: "chart", name: "Analytics", icon: BarChart3 },
  { id: "tag", name: "Tag", icon: Tag },
  { id: "inbox", name: "Inbox", icon: Inbox },
  { id: "camera", name: "Camera", icon: Camera },
  { id: "music", name: "Music", icon: Music },
  { id: "palette", name: "Palette", icon: Palette },
  { id: "video", name: "Video", icon: Video },
  { id: "brush", name: "Paintbrush", icon: Paintbrush },
  { id: "gamepad", name: "Gaming", icon: Gamepad2 },
  { id: "sparkles", name: "Sparkles", icon: Sparkles },
  { id: "lock", name: "Lock", icon: Lock },
  { id: "shield", name: "Shield", icon: Shield },
  { id: "key", name: "Key", icon: Key },
  { id: "settings", name: "Settings", icon: Settings },
  { id: "star", name: "Star", icon: Star },
  { id: "heart", name: "Heart", icon: Heart },
  { id: "check", name: "Approved", icon: CheckCircle2 },
  { id: "warning", name: "Warning", icon: AlertTriangle },
];

const PRESET_FOLDER_COLORS = [
  { name: "Yellow", hex: "#FDD835", hue: 48, sat: 0.98, lit: 0.6 },
  { name: "Sky Blue", hex: "#0288D1", hue: 201, sat: 0.98, lit: 0.41 },
  { name: "Navy Blue", hex: "#1565C0", hue: 212, sat: 0.8, lit: 0.42 },
  { name: "Emerald", hex: "#2E7D32", hue: 123, sat: 0.46, lit: 0.34 },
  { name: "Lime Green", hex: "#7CB342", hue: 88, sat: 0.5, lit: 0.48 },
  { name: "Ruby Red", hex: "#C62828", hue: 0, sat: 0.66, lit: 0.47 },
  { name: "Crimson", hex: "#AD1457", hue: 334, sat: 0.86, lit: 0.38 },
  { name: "Purple", hex: "#6A1B9A", hue: 277, sat: 0.7, lit: 0.36 },
  { name: "Amber", hex: "#EF6C00", hue: 27, sat: 1.0, lit: 0.47 },
  { name: "Graphite", hex: "#374151", hue: 217, sat: 0.19, lit: 0.27 },
  { name: "Slate", hex: "#64748B", hue: 215, sat: 0.16, lit: 0.47 },
  { name: "White/Silver", hex: "#E2E8F0", hue: 210, sat: 0.2, lit: 0.91 },
];

const STICKER_TINT_OPTIONS = [
  { label: "Original", value: null },
  { label: "Monochrome White", value: "#FFFFFF" },
  { label: "Graphite Dark", value: "#1F2937" },
  { label: "Gold Badge", value: "#F59E0B" },
  { label: "Accent Blue", value: "#2563EB" },
  { label: "Ruby Red", value: "#DC2626" },
];

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    name: "Smileys & Emotion",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗",
      "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥",
      "😏", "😒", "🙄", "😬", "😮‍💨", "🤥", "🫨", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
      "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "☹️", "😮", "😯",
      "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫",
      "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺",
      "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"
    ]
  },
  {
    id: "people",
    name: "People & Body",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫷", "🫸", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟",
      "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶",
      "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🫀", "🫁", "🧠",
      "🦷", "🦴", "👀", "👁️", "👅", "👄", "🫦", "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "👩", "🧓", "👴", "👵"
    ]
  },
  {
    id: "animals",
    name: "Animals & Nature",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧",
      "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲",
      "🕷️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋",
      "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🦒", "🦘", "🐉", "🌵", "🎄", "🌲", "🌳",
      "🌴", "🌱", "🌿", "☘️", "🍀", "🎍", "🪴", "🎋", "🍃", "🍂", "🍁", "🍄", "🐚", "🪨", "🌾", "💐", "🌷", "🌹",
      "🌻", "🌼", "🌸", "🌺", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "🔥", "💧", "🌊"
    ]
  },
  {
    id: "food",
    name: "Food & Drink",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅",
      "🥑", "🍆", "🥦", "🌽", "🌶️", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈",
      "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮", "🌯", "🥗", "🥘", "🍝", "🍜", "🍲",
      "🍛", "🍣", "🍱", "🥟", "🍤", "🍙", "🍚", "🍘", "🍢", "🥮", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂", "🍰", "🧁",
      "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "☕", "🍵", "🧃", "🥤", "🧋", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹"
    ]
  },
  {
    id: "activities",
    name: "Activities & Games",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅",
      "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", "🏂", "🏋️", "🤺", "🧗",
      "🎯", "🎮", "🕹️", "🎰", "🎲", "🧩", "♟️", "🎭", "🎨", "🧵", "🪡", "🧶", "🎼", "🎤", "🎧", "🎷", "🎸", "🎹",
      "🎺", "🎻", "🥁", "🎬", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎫", "🎟️", "🎪", "🎠", "🎡", "🎢"
    ]
  },
  {
    id: "objects",
    name: "Objects & Tech",
    emojis: [
      "💻", "🖥️", "🖨️", "⌨️", "🖱️", "💽", "💾", "💿", "📀", "📷", "📸", "📹", "🎥", "📽️", "📱", "☎️", "📞", "📟",
      "📺", "📻", "🎙️", "⏱️", "⏰", "🕰️", "⌛", "📡", "🔋", "🪫", "🔌", "💡", "🔦", "🕯️", "💸", "💵", "💰", "💳",
      "💎", "⚖️", "🧰", "🔧", "🔨", "⚒️", "🛠️", "⚙️", "🧱", "🧲", "🔫", "💣", "🧨", "🗡️", "⚔️", "🛡️", "🔮", "🧿",
      "💈", "⚗️", "🔭", "🔬", "💊", "💉", "🩸", "🧬", "🔑", "🗝️", "🚪", "📦", "🏷️", "📫", "📬", "📮", "📜", "📄",
      "📊", "📈", "📉", "📅", "📆", "🗃️", "📋", "📁", "📂", "🗂️", "🗞️", "📰", "📓", "📕", "📗", "📘", "📚", "📖",
      "🔖", "🔗", "📎", "✂️", "🖊️", "🖋️", "📝", "✏️", "🔍", "🔎", "🔒", "🔓", "🔏", "🔐"
    ]
  },
  {
    id: "symbols",
    name: "Symbols & Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
      "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌",
      "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️",
      "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕",
      "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔",
      "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎", "🌐",
      "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "🚻",
      "🚮", "🎦", "📶", "🈁", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "🔟", "🔢", "#️⃣", "*️⃣", "0️⃣", "1️⃣", "2️⃣", "3️⃣",
      "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻",
      "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", "◻️", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🟫"
    ]
  }
];

export const IconDesignerTab: React.FC<IconDesignerTabProps> = ({
  onSelectDesignedIcon,
}) => {
  // FolderIco Mode Sub-Tabs: "color" | "cover" | "sticker"
  const [activeSubTab, setActiveSubTab] = useState<"color" | "cover" | "sticker">("color");

  // Base Color State
  const [folderHue, setFolderHue] = useState<number>(48);
  const [folderSat, setFolderSat] = useState<number>(0.98);
  const [folderLit, setFolderLit] = useState<number>(0.6);

  // Cover Image State
  const [customCoverPath, setCustomCoverPath] = useState<string | null>(null);
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);
  const [coverNaturalSize, setCoverNaturalSize] = useState<{ width: number; height: number }>({
    width: 216,
    height: 140,
  });
  const [coverFitMode, setCoverFitMode] = useState<"cover" | "contain" | "custom">("cover");
  const [coverScale, setCoverScale] = useState<number>(1.0);
  const [coverOffsetX, setCoverOffsetX] = useState<number>(0);
  const [coverOffsetY, setCoverOffsetY] = useState<number>(0);

  // Sticker State
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>("🐱");
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);
  const [customStickerPath, setCustomStickerPath] = useState<string | null>(null);
  const [customStickerDataUrl, setCustomStickerDataUrl] = useState<string | null>(null);
  const [stickerCategory, setStickerCategory] = useState<string>("all");
  const [stickerSearch, setStickerSearch] = useState<string>("");
  const [stickerScale, setStickerScale] = useState<number>(0.38);
  const [stickerOffsetX, setStickerOffsetX] = useState<number>(0);
  const [stickerOffsetY, setStickerOffsetY] = useState<number>(0);
  const [stickerOpacity, setStickerOpacity] = useState<number>(1.0);
  const [stickerTintHex, setStickerTintHex] = useState<string | null>("#FFFFFF");

  // Drag / Interactive Transform Interaction State
  const [dragState, setDragState] = useState<{
    target: "cover" | "sticker";
    type: "move" | "nw" | "ne" | "se" | "sw";
    startX: number;
    startY: number;
    initOffsetX: number;
    initOffsetY: number;
    initScale: number;
  } | null>(null);

  // Staging / Status State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [stagedSuccess, setStagedSuccess] = useState<boolean>(false);

  const svgCanvasRef = useRef<SVGSVGElement | null>(null);
  const hiddenSvgContainerRef = useRef<HTMLDivElement | null>(null);

  // Current folder CSS color
  const currentFolderHex = useMemo(() => {
    return `hsl(${Math.round(folderHue)}, ${Math.round(folderSat * 100)}%, ${Math.round(
      folderLit * 100
    )}%)`;
  }, [folderHue, folderSat, folderLit]);

  // Selected Vector Component
  const ActiveVectorIcon = useMemo(() => {
    if (!selectedVectorId) return null;
    return BUILTIN_VECTOR_STICKERS.find((s) => s.id === selectedVectorId)?.icon || null;
  }, [selectedVectorId]);

  // Compute Cover Render Geometry on 256x256 Canvas
  // Front flap center: (128, 136), bounds: [16..240, 62..210] (width: 224, height: 148, rx: 16)
  const coverGeometry = useMemo(() => {
    const flapW = 224;
    const flapH = 148;
    const natW = coverNaturalSize.width || flapW;
    const natH = coverNaturalSize.height || flapH;

    let baseScale = 1;
    if (coverFitMode === "contain") {
      baseScale = Math.min(flapW / natW, flapH / natH);
    } else {
      // "cover" or "custom"
      baseScale = Math.max(flapW / natW, flapH / natH);
    }

    const w = natW * baseScale * coverScale;
    const h = natH * baseScale * coverScale;
    const x = 128 + coverOffsetX - w / 2;
    const y = 136 + coverOffsetY - h / 2;

    return { x, y, width: w, height: h };
  }, [coverNaturalSize, coverFitMode, coverScale, coverOffsetX, coverOffsetY]);

  // Compute Sticker Render Geometry on 256x256 Canvas
  const stickerGeometry = useMemo(() => {
    const size = 224 * stickerScale;
    const x = 128 + stickerOffsetX - size / 2;
    const y = 136 + stickerOffsetY - size / 2;
    return { x, y, size };
  }, [stickerScale, stickerOffsetX, stickerOffsetY]);

  // Render active SVG sticker to a 256px PNG Data URL for Rust compositing
  const renderSvgStickerDataUrl = async (): Promise<string | null> => {
    const container = hiddenSvgContainerRef.current;
    if (!container) return null;
    const svgEl = container.querySelector("svg");
    if (!svgEl) return null;

    try {
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(svgBlob);

      return await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, 256, 256);
            URL.revokeObjectURL(blobUrl);
            resolve(canvas.toDataURL("image/png"));
          } else {
            URL.revokeObjectURL(blobUrl);
            reject(new Error("Canvas context unavailable"));
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          reject(new Error("SVG rasterization failed"));
        };
        img.src = blobUrl;
      });
    } catch {
      return null;
    }
  };

  // Render emoji sticker to 256px PNG Data URL
  const renderEmojiStickerDataUrl = (emoji: string): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "180px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, 128, 140);
      return canvas.toDataURL("image/png");
    }
    return "";
  };

  // Compile and generate the designed icon
  const handleGenerateAndStage = useCallback(async () => {
    setIsGenerating(true);
    setStagedSuccess(false);

    try {
      let stickerDataUrl: string | null = null;
      if (selectedEmoji) {
        stickerDataUrl = renderEmojiStickerDataUrl(selectedEmoji);
      } else if (customStickerDataUrl) {
        stickerDataUrl = customStickerDataUrl;
      } else if (selectedVectorId) {
        stickerDataUrl = await renderSvgStickerDataUrl();
      }

      const options: DesignOptions = {
        hue: folderHue,
        saturation: folderSat,
        lightness: folderLit,
        custom_cover_path: customCoverPath,
        custom_cover_data_url: coverDataUrl,
        cover_fit_mode: coverFitMode,
        cover_scale: coverScale,
        cover_offset_x: coverOffsetX,
        cover_offset_y: coverOffsetY,
        sticker_path: customStickerPath,
        sticker_data_url: stickerDataUrl,
        sticker_scale: stickerScale,
        sticker_offset_x: stickerOffsetX,
        sticker_offset_y: stickerOffsetY,
        sticker_opacity: stickerOpacity,
        sticker_tint_hex: selectedVectorId ? stickerTintHex : null,
      };

      const result = await generateDesignedIcon(options);
      onSelectDesignedIcon(result.icon_path, result.preview_data_url);
      setStagedSuccess(true);
      setTimeout(() => setStagedSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to generate designed icon:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [
    folderHue,
    folderSat,
    folderLit,
    customCoverPath,
    coverDataUrl,
    coverFitMode,
    coverScale,
    coverOffsetX,
    coverOffsetY,
    selectedEmoji,
    customStickerPath,
    customStickerDataUrl,
    selectedVectorId,
    stickerScale,
    stickerOffsetX,
    stickerOffsetY,
    stickerOpacity,
    stickerTintHex,
    onSelectDesignedIcon,
  ]);

  // Initial stage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGenerateAndStage();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Handle Cover Upload
  const handleUploadCover = async () => {
    const selected = await selectImageDialog();
    if (selected) {
      try {
        const dataUrl = await getIconPreviewDataUrl(selected);
        setCustomCoverPath(selected);
        setCoverDataUrl(dataUrl);
        setActiveSubTab("cover");

        const img = new Image();
        img.onload = () => {
          setCoverNaturalSize({
            width: img.naturalWidth || 216,
            height: img.naturalHeight || 140,
          });
        };
        img.src = dataUrl;
      } catch (e) {
        console.error("Failed to load cover preview:", e);
      }
    }
  };

  // Handle Custom Sticker Upload
  const handleUploadCustomSticker = async () => {
    const selected = await selectImageDialog();
    if (selected) {
      try {
        const dataUrl = await getIconPreviewDataUrl(selected);
        setCustomStickerPath(selected);
        setCustomStickerDataUrl(dataUrl);
        setSelectedEmoji(null);
        setSelectedVectorId(null);
        setActiveSubTab("sticker");
      } catch (e) {
        console.error("Failed to load sticker preview:", e);
      }
    }
  };

  // Reset actions
  const handleClearCover = () => {
    setCustomCoverPath(null);
    setCoverDataUrl(null);
    setCoverScale(1.0);
    setCoverOffsetX(0);
    setCoverOffsetY(0);
    setCoverFitMode("cover");
  };

  const handleClearSticker = () => {
    setSelectedEmoji(null);
    setSelectedVectorId(null);
    setCustomStickerPath(null);
    setCustomStickerDataUrl(null);
    setStickerOffsetX(0);
    setStickerOffsetY(0);
  };

  const handleResetColor = () => {
    setFolderHue(48);
    setFolderSat(0.98);
    setFolderLit(0.6);
  };

  // Cycle cover fit mode
  const handleCycleCoverFitMode = () => {
    if (coverFitMode === "cover") {
      setCoverFitMode("contain");
    } else if (coverFitMode === "contain") {
      setCoverFitMode("custom");
    } else {
      setCoverFitMode("cover");
      setCoverScale(1.0);
      setCoverOffsetX(0);
      setCoverOffsetY(0);
    }
  };

  // Interactive Pointer Down Handler
  const handlePointerDown = (
    e: React.PointerEvent,
    target: "cover" | "sticker",
    type: "move" | "nw" | "ne" | "se" | "sw"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const initOffsetX = target === "cover" ? coverOffsetX : stickerOffsetX;
    const initOffsetY = target === "cover" ? coverOffsetY : stickerOffsetY;
    const initScale = target === "cover" ? coverScale : stickerScale;

    setDragState({
      target,
      type,
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX,
      initOffsetY,
      initScale,
    });
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || !svgCanvasRef.current) return;
    e.preventDefault();

    const rect = svgCanvasRef.current.getBoundingClientRect();
    const scaleRatio = 256 / (rect.width || 256);
    const deltaX = (e.clientX - dragState.startX) * scaleRatio;
    const deltaY = (e.clientY - dragState.startY) * scaleRatio;

    if (dragState.type === "move") {
      if (dragState.target === "cover") {
        setCoverOffsetX(Math.round(dragState.initOffsetX + deltaX));
        setCoverOffsetY(Math.round(dragState.initOffsetY + deltaY));
      } else {
        setStickerOffsetX(Math.round(dragState.initOffsetX + deltaX));
        setStickerOffsetY(Math.round(dragState.initOffsetY + deltaY));
      }
    } else {
      // Corner resize handle
      const sign =
        dragState.type === "se" || dragState.type === "ne" ? 1 : -1;
      const dist = (deltaX * sign + deltaY * (dragState.type === "se" || dragState.type === "sw" ? 1 : -1)) / 2;
      const scaleMultiplier = Math.max(0.15, 1 + dist / 80);

      if (dragState.target === "cover") {
        setCoverScale(Number((dragState.initScale * scaleMultiplier).toFixed(2)));
        if (coverFitMode !== "custom") {
          setCoverFitMode("custom");
        }
      } else {
        setStickerScale(Number(Math.min(0.9, Math.max(0.15, dragState.initScale * scaleMultiplier)).toFixed(2)));
      }
    }
  };

  // Pointer Up Handler
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already lost
      }
      setDragState(null);
    }
  };

  // Filter stickers by search or category
  const filteredEmojiCategories = useMemo(() => {
    if (!stickerSearch.trim()) {
      if (stickerCategory === "all") return EMOJI_CATEGORIES;
      return EMOJI_CATEGORIES.filter((c) => c.id === stickerCategory);
    }
    const q = stickerSearch.toLowerCase().trim();
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter(() => cat.name.toLowerCase().includes(q) || cat.id.includes(q)),
    })).filter((cat) => cat.emojis.length > 0);
  }, [stickerCategory, stickerSearch]);

  const filteredVectorStickers = useMemo(() => {
    if (!stickerSearch.trim()) return BUILTIN_VECTOR_STICKERS;
    const q = stickerSearch.toLowerCase().trim();
    return BUILTIN_VECTOR_STICKERS.filter((s) => s.name.toLowerCase().includes(q));
  }, [stickerSearch]);

  const hasCover = Boolean(coverDataUrl);
  const hasSticker = Boolean(selectedEmoji || customStickerDataUrl || selectedVectorId);

  return (
    <div className="flex flex-col h-full overflow-hidden gap-3 select-none">
      {/* Hidden offscreen container used to rasterize SVG stickers */}
      <div
        ref={hiddenSvgContainerRef}
        style={{ position: "absolute", left: -9999, top: -9999, width: 256, height: 256 }}
        aria-hidden="true"
      >
        {ActiveVectorIcon && (
          <ActiveVectorIcon
            width={256}
            height={256}
            stroke={stickerTintHex || "#FFFFFF"}
            strokeWidth={1.8}
            fill="none"
          />
        )}
      </div>

      {/* Top FolderIco-Style Mode Bar: [ Color x ] [ Cover x ] [ Sticker x ] */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shrink-0">
        <div className="flex items-center gap-2">
          {/* Color SubTab */}
          <div
            onClick={() => setActiveSubTab("color")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === "color"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetColor();
              }}
              title="Reset color to default"
              className="p-0.5 hover:bg-black/20 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Cover SubTab */}
          <div
            onClick={() => setActiveSubTab("cover")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === "cover"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Cover</span>
            {hasCover && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearCover();
              }}
              title="Remove cover image"
              className="p-0.5 hover:bg-black/20 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Sticker SubTab */}
          <div
            onClick={() => setActiveSubTab("sticker")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === "sticker"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700"
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Sticker</span>
            {hasSticker && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearSticker();
              }}
              title="Remove sticker"
              className="p-0.5 hover:bg-black/20 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Live Staging Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAndStage}
            disabled={isGenerating}
            className={`px-3 py-1 text-xs font-semibold rounded-lg text-white transition-all flex items-center gap-1.5 shadow-xs ${
              stagedSuccess
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : stagedSuccess ? (
              <Check className="w-3 h-3 stroke-[3]" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>{stagedSuccess ? "Staged!" : "Stage Custom Design"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: Canvas on Left, Controls on Right */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
        {/* Left Column: Interactive 256x256 Folder Canvas */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 shadow-xs">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Icon Canvas
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">256 x 256 Multi-ICO</span>
          </div>

          {/* Live SVG Canvas Container */}
          <div
            className="relative w-64 h-64 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-900/10 dark:bg-zinc-950 flex items-center justify-center overflow-hidden shadow-inner p-1 select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <svg
              ref={svgCanvasRef}
              viewBox="0 0 256 256"
              className="w-full h-full drop-shadow-md overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Windows 11 Front Flap Mask: x: 16..240 (w:224), y: 62..210 (h:148), rx: 16 matching FolderIco */}
                <clipPath id="folder-front-flap-clip">
                  <rect x="16" y="62" width="224" height="148" rx="16" ry="16" />
                </clipPath>
              </defs>

              {/* 1. Back Tab & Back Body */}
              <path
                d="M 20 44 C 20 38, 26 34, 34 34 L 102 34 C 108 34, 114 38, 118 44 L 126 58 L 228 58 C 235 58, 240 63, 240 70 L 240 206 C 240 214, 234 220, 226 220 L 20 220 Z"
                fill={currentFolderHex}
                fillOpacity="0.88"
              />

              {/* 2. Drop Shadow under front cover */}
              <rect x="18" y="206" width="220" height="10" rx="5" fill="#000000" opacity="0.16" />

              {/* 3. Front Flap Base (Solid closed Windows 11 style matching FolderIco) */}
              <rect
                x="16"
                y="62"
                width="224"
                height="148"
                rx="16"
                ry="16"
                fill={currentFolderHex}
                onClick={() => setActiveSubTab("color")}
                className="cursor-pointer"
              />

              {/* Front flap specular highlight */}
              <rect
                x="18"
                y="62"
                width="220"
                height="2"
                rx="1"
                fill="#FFFFFF"
                fillOpacity="0.35"
              />

              {/* Subtle flap depth gradient */}
              <rect
                x="16"
                y="62"
                width="224"
                height="148"
                rx="16"
                ry="16"
                fill="#000000"
                fillOpacity="0.04"
                onClick={() => setActiveSubTab("color")}
                className="cursor-pointer"
              />

              {/* 5. Masked Cover Image Layer */}
              {coverDataUrl && (
                <g clipPath="url(#folder-front-flap-clip)">
                  <image
                    href={coverDataUrl}
                    x={coverGeometry.x}
                    y={coverGeometry.y}
                    width={coverGeometry.width}
                    height={coverGeometry.height}
                    preserveAspectRatio="none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSubTab("cover");
                    }}
                    className="cursor-pointer"
                  />
                </g>
              )}

              {/* 6. Sticker Layer on Front Flap */}
              {hasSticker && (
                <g
                  transform={`translate(${stickerGeometry.x}, ${stickerGeometry.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSubTab("sticker");
                  }}
                  className="cursor-pointer"
                  opacity={stickerOpacity}
                >
                  {selectedEmoji ? (
                    <text
                      x={stickerGeometry.size / 2}
                      y={stickerGeometry.size / 2}
                      fontSize={stickerGeometry.size * 0.85}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ userSelect: "none" }}
                    >
                      {selectedEmoji}
                    </text>
                  ) : customStickerDataUrl ? (
                    <image
                      href={customStickerDataUrl}
                      x="0"
                      y="0"
                      width={stickerGeometry.size}
                      height={stickerGeometry.size}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ) : ActiveVectorIcon ? (
                    <svg
                      width={stickerGeometry.size}
                      height={stickerGeometry.size}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={stickerTintHex || "#FFFFFF"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <ActiveVectorIcon />
                    </svg>
                  ) : null}
                </g>
              )}

              {/* 7. Interactive Transform Box for Cover Layer */}
              {activeSubTab === "cover" && coverDataUrl && (
                <g className="cursor-move">
                  {/* Bounding Box Outline */}
                  <rect
                    x={coverGeometry.x}
                    y={coverGeometry.y}
                    width={coverGeometry.width}
                    height={coverGeometry.height}
                    fill="rgba(59, 130, 246, 0.08)"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    onPointerDown={(e) => handlePointerDown(e, "cover", "move")}
                  />

                  {/* 4 Corner Resize Handles */}
                  {[
                    { type: "nw", cx: coverGeometry.x, cy: coverGeometry.y, cursor: "nwse-resize" },
                    { type: "ne", cx: coverGeometry.x + coverGeometry.width, cy: coverGeometry.y, cursor: "nesw-resize" },
                    { type: "se", cx: coverGeometry.x + coverGeometry.width, cy: coverGeometry.y + coverGeometry.height, cursor: "nwse-resize" },
                    { type: "sw", cx: coverGeometry.x, cy: coverGeometry.y + coverGeometry.height, cursor: "nesw-resize" },
                  ].map((h) => (
                    <rect
                      key={h.type}
                      x={h.cx - 4}
                      y={h.cy - 4}
                      width="8"
                      height="8"
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      style={{ cursor: h.cursor }}
                      onPointerDown={(e) =>
                        handlePointerDown(e, "cover", h.type as "nw" | "ne" | "se" | "sw")
                      }
                    />
                  ))}
                </g>
              )}

              {/* 8. Interactive Transform Box for Sticker Layer */}
              {activeSubTab === "sticker" && hasSticker && (
                <g className="cursor-move">
                  {/* Bounding Box Outline */}
                  <rect
                    x={stickerGeometry.x}
                    y={stickerGeometry.y}
                    width={stickerGeometry.size}
                    height={stickerGeometry.size}
                    fill="rgba(59, 130, 246, 0.08)"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    onPointerDown={(e) => handlePointerDown(e, "sticker", "move")}
                  />

                  {/* 4 Corner Resize Handles */}
                  {[
                    { type: "nw", cx: stickerGeometry.x, cy: stickerGeometry.y, cursor: "nwse-resize" },
                    { type: "ne", cx: stickerGeometry.x + stickerGeometry.size, cy: stickerGeometry.y, cursor: "nesw-resize" },
                    { type: "se", cx: stickerGeometry.x + stickerGeometry.size, cy: stickerGeometry.y + stickerGeometry.size, cursor: "nwse-resize" },
                    { type: "sw", cx: stickerGeometry.x, cy: stickerGeometry.y + stickerGeometry.size, cursor: "nesw-resize" },
                  ].map((h) => (
                    <rect
                      key={h.type}
                      x={h.cx - 4}
                      y={h.cy - 4}
                      width="8"
                      height="8"
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      style={{ cursor: h.cursor }}
                      onPointerDown={(e) =>
                        handlePointerDown(e, "sticker", h.type as "nw" | "ne" | "se" | "sw")
                      }
                    />
                  ))}
                </g>
              )}
            </svg>

            {/* Floating Quick Action Mini-Toolbar (FolderIco Style) */}
            {activeSubTab === "cover" && coverDataUrl && (
              <div
                className="absolute z-20 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md text-white px-1.5 py-1 rounded-md shadow-lg border border-zinc-700/80 pointer-events-auto"
                style={{
                  left: "50%",
                  top: "10px",
                  transform: "translateX(-50%)",
                }}
              >
                <button
                  onClick={handleCycleCoverFitMode}
                  title={`Fit Mode: ${coverFitMode} (Click to toggle)`}
                  className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-200 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="capitalize">{coverFitMode}</span>
                </button>
                <div className="w-px h-3.5 bg-zinc-700 mx-0.5" />
                <button
                  onClick={handleClearCover}
                  title="Remove cover image"
                  className="p-1 hover:bg-red-600/80 rounded transition-colors text-zinc-300 hover:text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {activeSubTab === "sticker" && hasSticker && (
              <div
                className="absolute z-20 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md text-white px-1.5 py-1 rounded-md shadow-lg border border-zinc-700/80 pointer-events-auto"
                style={{
                  left: "50%",
                  top: "10px",
                  transform: "translateX(-50%)",
                }}
              >
                <span className="text-[10px] text-zinc-300 px-1 font-medium">Sticker Layer</span>
                <div className="w-px h-3.5 bg-zinc-700 mx-0.5" />
                <button
                  onClick={handleClearSticker}
                  title="Remove sticker"
                  className="p-1 hover:bg-red-600/80 rounded transition-colors text-zinc-300 hover:text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Stage Action */}
          <div className="w-full mt-3">
            <button
              onClick={handleGenerateAndStage}
              disabled={isGenerating}
              className={`w-full py-2.5 px-3 text-xs font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                stagedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling Multi-ICO...</span>
                </>
              ) : stagedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Staged! Click Apply on Left Sidebar</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Stage Custom Design</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-500 text-center mt-1.5">
              Click & drag canvas to move or resize elements directly.
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Tool Panel Based on Active SubTab */}
        <div className="flex-1 overflow-y-auto p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
          {/* TAB 1: COLOR CONTROLS */}
          {activeSubTab === "color" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Folder Base Color
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Select a curated Windows preset or fine-tune hue, saturation and lightness.
                  </p>
                </div>
                <button
                  onClick={handleResetColor}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* 12 Presets Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                {PRESET_FOLDER_COLORS.map((preset) => {
                  const isSelected =
                    Math.abs(preset.hue - folderHue) < 4 &&
                    Math.abs(preset.sat - folderSat) < 0.1 &&
                    Math.abs(preset.lit - folderLit) < 0.1;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setFolderHue(preset.hue);
                        setFolderSat(preset.sat);
                        setFolderLit(preset.lit);
                      }}
                      className={`relative flex flex-col items-center p-2 rounded-xl border transition-all ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg shadow-xs border border-black/10 mb-1"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate w-full text-center">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* HSL Adjustment Sliders */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-500" />
                  <span>Fine HSL Color Sliders</span>
                </h4>

                {/* Hue Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    <span>Hue Angle</span>
                    <span>{Math.round(folderHue)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={Math.round(folderHue)}
                    onChange={(e) => setFolderHue(Number(e.target.value))}
                    className="w-full cursor-pointer h-2 rounded-lg"
                    style={{
                      background:
                        "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                    }}
                  />
                </div>

                {/* Saturation Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    <span>Saturation</span>
                    <span>{Math.round(folderSat * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(folderSat * 100)}
                    onChange={(e) => setFolderSat(Number(e.target.value) / 100)}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                  />
                </div>

                {/* Lightness Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    <span>Lightness</span>
                    <span>{Math.round(folderLit * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={Math.round(folderLit * 100)}
                    onChange={(e) => setFolderLit(Number(e.target.value) / 100)}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COVER IMAGE CONTROLS */}
          {activeSubTab === "cover" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Custom Folder Cover
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Upload an image to mask onto the front flap of the folder like FolderIco.
                  </p>
                </div>
                {hasCover && (
                  <button
                    onClick={handleClearCover}
                    className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Cover</span>
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div className="pt-1">
                <button
                  onClick={handleUploadCover}
                  className="w-full py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group"
                >
                  <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                      {hasCover ? "Choose Different Cover Image..." : "Upload Cover Image..."}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Supports PNG, JPG, JPEG, WEBP, BMP, ICO
                    </span>
                  </div>
                </button>
              </div>

              {/* Cover Transform & Fit Settings */}
              {hasCover && (
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Fit Mode & Placement
                  </h4>

                  {/* Fit Mode Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { mode: "cover", label: "Fill Flap (Cover)" },
                      { mode: "contain", label: "Fit Inside (Contain)" },
                      { mode: "custom", label: "Custom Transform" },
                    ].map((f) => (
                      <button
                        key={f.mode}
                        onClick={() => setCoverFitMode(f.mode as "cover" | "contain" | "custom")}
                        className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                          coverFitMode === f.mode
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Sliders for fine control */}
                  <div className="space-y-3 pt-1">
                    {/* Scale */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        <span>Cover Scale</span>
                        <span>{Math.round(coverScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="25"
                        max="250"
                        value={Math.round(coverScale * 100)}
                        onChange={(e) => {
                          setCoverScale(Number(e.target.value) / 100);
                          setCoverFitMode("custom");
                        }}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                      />
                    </div>

                    {/* Horizontal Pan */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        <span>Horizontal Pan (X)</span>
                        <span>{Math.round(coverOffsetX)}px</span>
                      </div>
                      <input
                        type="range"
                        min="-120"
                        max="120"
                        value={coverOffsetX}
                        onChange={(e) => setCoverOffsetX(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                      />
                    </div>

                    {/* Vertical Pan */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        <span>Vertical Pan (Y)</span>
                        <span>{Math.round(coverOffsetY)}px</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={coverOffsetY}
                        onChange={(e) => setCoverOffsetY(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                      />
                    </div>

                    {/* Reset Placement */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setCoverScale(1.0);
                          setCoverOffsetX(0);
                          setCoverOffsetY(0);
                          setCoverFitMode("cover");
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Center & Reset Transform</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STICKER CONTROLS */}
          {activeSubTab === "sticker" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Stickers & Emojis
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Select any standard color emoji, dev vector icon, or upload a custom sticker.
                  </p>
                </div>
                <button
                  onClick={handleUploadCustomSticker}
                  className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Custom Sticker</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search in stickers and emojis..."
                  value={stickerSearch}
                  onChange={(e) => setStickerSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
                {stickerSearch && (
                  <button
                    onClick={() => setStickerSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  { id: "all", name: "All" },
                  { id: "smileys", name: "Smileys" },
                  { id: "people", name: "People" },
                  { id: "animals", name: "Animals" },
                  { id: "food", name: "Food" },
                  { id: "activities", name: "Activities" },
                  { id: "objects", name: "Objects" },
                  { id: "symbols", name: "Symbols" },
                  { id: "dev", name: "Dev Icons" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setStickerCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                      stickerCategory === cat.id
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Stickers & Emojis Scrollable Catalog */}
              <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
                {/* 1. Emoji Categories */}
                {stickerCategory !== "dev" &&
                  filteredEmojiCategories.map((cat) => (
                    <div key={cat.id}>
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                        {cat.name}
                      </span>
                      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                        {cat.emojis.map((emoji) => {
                          const isSelected = selectedEmoji === emoji;
                          return (
                            <button
                              key={emoji}
                              onClick={() => {
                                setSelectedEmoji(emoji);
                                setSelectedVectorId(null);
                                setCustomStickerPath(null);
                                setCustomStickerDataUrl(null);
                              }}
                              className={`h-9 flex items-center justify-center text-xl rounded-lg transition-transform hover:scale-125 ${
                                isSelected
                                  ? "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500 scale-110"
                                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              }`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                {/* 2. Vector Dev Icons */}
                {(stickerCategory === "all" || stickerCategory === "dev") && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Developer & Tech Icons
                    </span>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                      {filteredVectorStickers.map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = selectedVectorId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedVectorId(item.id);
                              setSelectedEmoji(null);
                              setCustomStickerPath(null);
                              setCustomStickerDataUrl(null);
                            }}
                            title={item.name}
                            className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                                : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticker Scale, Opacity, and Tint */}
              {hasSticker && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Scale */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        <span>Sticker Scale</span>
                        <span>{Math.round(stickerScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="85"
                        value={Math.round(stickerScale * 100)}
                        onChange={(e) => setStickerScale(Number(e.target.value) / 100)}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                      />
                    </div>

                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        <span>Opacity</span>
                        <span>{Math.round(stickerOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={Math.round(stickerOpacity * 100)}
                        onChange={(e) => setStickerOpacity(Number(e.target.value) / 100)}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Quick Position Presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-medium text-zinc-500 shrink-0">Presets:</span>
                    {[
                      { label: "Front Pocket", x: 0, y: 10 },
                      { label: "Center", x: 0, y: 0 },
                      { label: "Bottom Right", x: 42, y: 32 },
                      { label: "Top Right", x: 42, y: -25 },
                    ].map((pos) => (
                      <button
                        key={pos.label}
                        onClick={() => {
                          setStickerOffsetX(pos.x);
                          setStickerOffsetY(pos.y);
                        }}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>

                  {/* Tint options for vector icons */}
                  {selectedVectorId && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 block mb-1.5">
                        Vector Icon Tint
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {STICKER_TINT_OPTIONS.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => setStickerTintHex(opt.value)}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                              stickerTintHex === opt.value
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                            }`}
                          >
                            {opt.value && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/20"
                                style={{ backgroundColor: opt.value }}
                              />
                            )}
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
