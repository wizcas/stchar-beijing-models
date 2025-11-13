// CSS类名常量定义模块

// CSS类名常量对象
const CSS_CLASSES = {
  // 字段网格布局 (140 chars, used 10+ times)
  FIELD_GRID:
    "grid grid-cols-[140px_1fr] md:grid-cols-[120px_1fr] sm:grid-cols-1 gap-4 md:gap-3 sm:gap-2 py-2 items-start border-b border-[var(--color-border-subtle)] last:border-b-0",

  // 字段标签样式 (90 chars, used 10+ times)
  FIELD_LABEL:
    "text-[var(--color-accent-silver)] font-semibold self-start sm:mb-2 text-sm tracking-wide",

  // 字段值样式 (70 chars, used 10+ times)
  FIELD_VALUE:
    "text-[var(--color-text-primary)] self-start text-sm leading-relaxed",

  // 子部分卡片样式 (150 chars, used 5+ times)
  SUBSECTION_CARD:
    "bg-[var(--color-surface-accent)] border border-[var(--color-border-accent)] p-5 rounded-[var(--radius-element)] h-fit shadow-[var(--shadow-element)] flex flex-col gap-4",

  // 部分标题样式 (100 chars, used 5+ times)
  SECTION_TITLE:
    "text-[var(--color-accent-amber)] font-semibold text-left text-md tracking-wide flex items-center",

  // 器材项目样式 (130 chars, used 3+ times)
  EQUIPMENT_ITEM:
    "bg-gradient-to-br from-[var(--color-surface-secondary)] to-[var(--color-surface-accent)] border border-[var(--color-border-subtle)] p-4 rounded-[var(--radius-element)]",

  // 器材项目全宽样式 (160 chars, used 1+ times)
  EQUIPMENT_ITEM_FULL:
    "bg-gradient-to-br from-[var(--color-surface-secondary)] to-[var(--color-surface-accent)] border border-[var(--color-border-subtle)] p-4 rounded-[var(--radius-element)] col-span-1 lg:col-span-full",

  // 类别标题样式 (80 chars, used 3+ times)
  CATEGORY_TITLE:
    "text-[var(--color-accent-red)] font-semibold mb-3 text-sm tracking-wide uppercase",

  // 可折叠标题容器 (140 chars, used 1+ times)
  COLLAPSIBLE_TITLE:
    "flex items-center justify-between cursor-pointer select-none p-5 rounded-[var(--radius-element)] hover:bg-black hover:bg-opacity-10 transition-colors duration-200",

  // 折叠图标 (90 chars, used 1+ times)
  COLLAPSE_ICON:
    "text-[var(--color-accent-amber)] text-lg font-bold transition-transform duration-200 ease-in-out",

  // 数组项目样式 (120 chars, used 2+ times)
  ARRAY_ITEM:
    "bg-[var(--color-surface-secondary)] p-3 border-l-4 border-l-[var(--color-accent-silver)] rounded-[var(--radius-element)] flex flex-col gap-3",

  // 网格布局
  SUBSECTIONS_GRID:
    "grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 mt-4",
  EQUIPMENT_GRID: "grid grid-cols-1 lg:grid-cols-2 gap-4",

  // 内容容器
  CONTENT_CONTAINER: "flex flex-col gap-3",
  CONTENT_CONTAINER_LARGE: "flex flex-col gap-4",
  CHARACTER_CONTENT: "flex flex-col gap-4 p-5",

  // 女性角色卡片相关
  WOMAN_CARD_CONTENT: "woman-card-content",
  WOMAN_CARD_SCROLL_CONTAINER: "woman-card-scroll-container",

  // 瀑布流布局
  SUBSECTIONS_MASONRY: "masonry-grid",
  MASONRY_ITEM: "masonry-item",

  // 字段容器（新的统一样式）
  FIELD_CONTAINER: "field-container",
};

// 标签相关的CSS类名
const TAG_CLASSES = {
  BASE: "tag-base",
  CONTAINER: "tag-container",
};

// 可折叠内容相关的CSS类名
const COLLAPSIBLE_CLASSES = {
  CONTENT:
    "collapsible-content overflow-hidden transition-all duration-200 ease-in-out",
};

// 导出CSS常量
export { CSS_CLASSES, TAG_CLASSES, COLLAPSIBLE_CLASSES };
