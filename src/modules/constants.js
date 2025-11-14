/**
 * 常量管理模块
 * 集中管理应用程序中所有的常量值
 */

/**
 * UI 布局相关常量
 * @type {Object}
 * @property {number} COLLAPSE_ANIMATION - 折叠动画时长（毫秒）
 * @property {number} SCROLL_MAX_HEIGHT - 女性角色卡片最大滚动高度（像素）
 * @property {number} MASONRY_MIN_ITEM_WIDTH - 瀑布流最小项目宽度（像素）
 * @property {number} MASONRY_MAX_COLUMNS - 瀑布流最大列数
 * @property {number} MASONRY_GAP - 瀑布流间距（像素）
 */
export const LAYOUT = {
  COLLAPSE_ANIMATION: 200,
  SCROLL_MAX_HEIGHT: 350,
  SCROLL_MAX_HEIGHT_MOBILE: 320,
  MASONRY_MIN_ITEM_WIDTH: 350,
  MASONRY_MAX_COLUMNS: 2,
  MASONRY_GAP: 16,
  RESIZE_DEBOUNCE: 150,
  CONTENT_UPDATE_DELAY: 50,
};

/**
 * 角色类型枚举
 * @type {Object}
 * @property {string} USER - 用户角色
 * @property {string} WOMAN - 女性角色
 * @property {string} SYSTEM - 系统分类
 * @property {string} UNKNOWN - 未知类型
 */
export const CHARACTER_TYPES = {
  USER: 'user',
  WOMAN: 'woman',
  SYSTEM: 'system',
  UNKNOWN: 'unknown',
};

/**
 * 特殊字段名称常量
 * 用于标识需要特殊处理的字段
 * @type {Object}
 */
export const SPECIAL_FIELDS = {
  NICKNAME: '昵称',
  REAL_NAME: '真名',
  FULL_NAME: '全名',
  NAME: '名字',
  SURNAME: '姓名',
  BUST: '胸围',
  WAIST: '腰围',
  HIP: '臀围',
  HEIGHT: '身高',
  WEIGHT: '体重',
  THOUGHTS: '想法',
  MEASUREMENTS: '三围',
};

/**
 * 器材相关关键字
 * 用于识别器材对象格式
 * @type {string[]}
 */
export const EQUIPMENT_KEYWORDS = [
  '机身',
  '镜头',
  '灯光',
  '配件',
  '其他',
  '设备',
];

/**
 * 器材对象分类顺序
 * @type {Object}
 */
export const EQUIPMENT_CATEGORIES = {
  OTHER: '其他',
};

/**
 * 数据加载相关常量
 * @type {Object}
 * @property {string} LOADING_TEXT - 加载提示文本
 * @property {string} ERROR_PREFIX - 错误信息前缀
 * @property {string} TEST_DATA_FILE - 测试数据文件名
 */
export const DATA_LOADING = {
  LOADING_TEXT: '正在加载状态数据...',
  ERROR_PREFIX: '加载失败: ',
  TEST_DATA_FILE: 'char-var.json',
  STATUS_BAR_KEY: '状态栏',
  WOMAN_SECTION_KEY: '女人',
};

/**
 * API 端点常量
 * @type {Object}
 */
export const API_ENDPOINTS = {
  GET_STATUS: '/getvar 状态栏',
};

/**
 * 页面元素 ID
 * @type {Object}
 */
export const ELEMENT_IDS = {
  STATUS_DISPLAY: 'status-display',
  TITLE_USER: '.title-user',
  TITLE_TEXT: '.title-text',
};

/**
 * 特殊字段处理配置
 * @type {Object}
 */
export const FIELD_TRANSFORMATIONS = {
  // 需要添加单位的字段
  HEIGHT_UNIT: ' cm',
  WEIGHT_UNIT: ' kg',
  MEASUREMENTS_FORMAT: '{bust}-{waist}-{hip} cm',
};

export default {
  LAYOUT,
  CHARACTER_TYPES,
  SPECIAL_FIELDS,
  EQUIPMENT_KEYWORDS,
  EQUIPMENT_CATEGORIES,
  DATA_LOADING,
  API_ENDPOINTS,
  ELEMENT_IDS,
  FIELD_TRANSFORMATIONS,
};
