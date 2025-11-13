// CSS类名常量定义模块

// CSS类名常量对象
const CSS_CLASSES = {
  // 字段网格布局 (140 chars, used 10+ times)
  FIELD_GRID:
    "grid grid-cols-[140px_1fr] md:grid-cols-[120px_1fr] sm:grid-cols-1 gap-2 md:gap-2 sm:gap-1.5 py-1 items-start border-b border-border-subtle last:border-b-0",

  // 字段标签样式 (90 chars, used 10+ times)
  FIELD_LABEL:
    "text-accent-silver font-semibold self-start sm:mb-2 text-sm tracking-wide",

  // 字段值样式 (70 chars, used 10+ times)
  FIELD_VALUE:
    "text-text-primary self-start text-sm leading-relaxed",

  // 子部分卡片样式 (150 chars, used 5+ times)
  SUBSECTION_CARD:
    "bg-surface-accent border border-border-accent p-3 rounded-[var(--radius-element)] h-fit shadow-[var(--shadow-element)] flex flex-col gap-2",

  // 部分标题样式 (100 chars, used 5+ times)
  SECTION_TITLE:
    "text-accent-amber font-semibold text-left text-md tracking-wide flex items-center",

    // 器材项目样式 (130 chars, used 3+ times)
  EQUIPMENT_ITEM:
    "bg-gradient-to-br from-surface-secondary to-surface-accent border border-border-subtle p-2.5 rounded-[var(--radius-element)]",

  // 器材项目全宽样式 (160 chars, used 1+ times)
  EQUIPMENT_ITEM_FULL:
    "bg-gradient-to-br from-surface-secondary to-surface-accent border border-border-subtle p-2.5 rounded-[var(--radius-element)] col-span-1 lg:col-span-full",

  // 类别标题样式 (80 chars, used 3+ times)
  CATEGORY_TITLE:
    "text-accent-red font-semibold mb-2 text-sm tracking-wide uppercase",

  // 可折叠标题容器 (140 chars, used 1+ times)
  COLLAPSIBLE_TITLE:
    "flex items-center justify-between cursor-pointer select-none p-3 rounded-[var(--radius-element)] hover:bg-black hover:bg-opacity-10 transition-colors duration-200",

  // 折叠图标 (90 chars, used 1+ times)
  COLLAPSE_ICON:
    "text-accent-amber text-lg font-bold transition-transform duration-200 ease-in-out",

  // 数组项目样式 (120 chars, used 2+ times)
  ARRAY_ITEM:
    "bg-surface-secondary p-2 border-l-4 border-l-accent-silver rounded-[var(--radius-element)] flex flex-col gap-2",

  // 网格布局
  SUBSECTIONS_GRID:
    "grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3 mt-2",
  EQUIPMENT_GRID: "grid grid-cols-1 lg:grid-cols-2 gap-2.5",

  // 内容容器
  CONTENT_CONTAINER: "flex flex-col gap-2",
  CONTENT_CONTAINER_LARGE: "flex flex-col gap-2.5",
  CHARACTER_CONTENT: "flex flex-col gap-2.5 p-3",

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
