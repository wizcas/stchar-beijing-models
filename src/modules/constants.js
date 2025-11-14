/**
 * 常量管理模块
 * 集中管理应用程序中所有的常量值
 */

/**
 * 角色类型枚举
 * @type {Object}
 * @property {string} USER - 用户角色
 * @property {string} WOMAN - 女性角色
 */
export const CHARACTER_TYPES = {
  USER: "user",
  WOMAN: "woman",
};

/**
 * 特殊字段名称常量
 * 用于标识需要特殊处理的字段
 * @type {Object}
 */
export const SPECIAL_FIELDS = {
  NICKNAME: "昵称",
  REAL_NAME: "真名",
  FULL_NAME: "全名",
  NAME: "名字",
  SURNAME: "姓名",
  BUST: "胸围",
  WAIST: "腰围",
  HIP: "臀围",
  HEIGHT: "身高",
  WEIGHT: "体重",
  THOUGHTS: "想法",
  MEASUREMENTS: "三围",
};

/**
 * 器材相关关键字
 * 用于识别器材对象格式
 * @type {string[]}
 */
export const EQUIPMENT_KEYWORDS = [
  "机身",
  "镜头",
  "灯光",
  "配件",
  "其他",
  "设备",
];

/**
 * 器材对象分类常量
 * @type {Object}
 */
export const EQUIPMENT_CATEGORIES = {
  OTHER: "其他",
};

/**
 * 数据加载相关常量
 * @type {Object}
 * @property {string} LOADING_TEXT - 加载提示文本
 * @property {string} ERROR_PREFIX - 错误信息前缀
 * @property {string} TEST_DATA_FILE - 测试数据文件名
 * @property {string} STATUS_BAR_KEY - 状态栏数据的 key
 * @property {string} WOMAN_SECTION_KEY - 女性角色数据的 key
 */
export const DATA_LOADING = {
   LOADING_TEXT: "正在加载状态数据...",
   ERROR_PREFIX: "加载失败: ",
   TEST_DATA_FILE: "status-vars.debug.json",
   STATUS_BAR_KEY: "状态栏",
   WOMAN_SECTION_KEY: "女人",
};

/**
 * API 端点常量
 * @type {Object}
 * @property {string} GET_STATUS - 获取状态栏数据的 API 端点
 */
export const API_ENDPOINTS = {
  GET_STATUS: "/getvar 状态栏",
};

/**
 * 页面元素 ID
 * @type {Object}
 * @property {string} STATUS_DISPLAY - 状态显示容器的 ID
 */
export const ELEMENT_IDS = {
  STATUS_DISPLAY: "status-display",
};

export default {
  CHARACTER_TYPES,
  SPECIAL_FIELDS,
  EQUIPMENT_KEYWORDS,
  EQUIPMENT_CATEGORIES,
  DATA_LOADING,
  API_ENDPOINTS,
  ELEMENT_IDS,
};
