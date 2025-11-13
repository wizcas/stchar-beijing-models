// 字段配置和顺序管理模块

// 字段配置数组 - 定义所有字段及其emoji
const fieldConfig = [
  // 用户字段
  { name: "行业等级", emoji: "⭐" },
  { name: "想法", emoji: "💭" },
  { name: "堕落度", emoji: "😈" },
  { name: "穿搭", emoji: "👕" },
  { name: "器材", emoji: "📸" },

  // 女性角色字段
  { name: "关系", emoji: "👥" },
  { name: "外型", emoji: "🎨" },
  { name: "职业", emoji: "💼" },
  { name: "性爱", emoji: "🔞" },

  // 关系子字段
  { name: "好感度", emoji: "💕" },

  // 外型子字段
  { name: "五官", emoji: "👁️" },
  { name: "发型", emoji: "💇" },
  { name: "身高", emoji: "📏" },
  { name: "体重", emoji: "⚖️" },
  { name: "三围", emoji: "📐" },
  { name: "罩杯", emoji: "👙" },

  // 职业子字段
  { name: "类型", emoji: "🏷️" },
  { name: "层级", emoji: "📊" },
  { name: "方向", emoji: "🎯" },
  { name: "尺度", emoji: "🌡️" },
  { name: "人设", emoji: "🎭" },

  // 性爱子字段
  { name: "性癖", emoji: "💋" },
  { name: "性经验次数", emoji: "🔢" },
  { name: "乳房敏感度", emoji: "🌡️" },
  { name: "小穴湿润度", emoji: "💧" },
  { name: "肛门松弛度", emoji: "🔄" },

  // 器材类别
  { name: "机身", emoji: "📷" },
  { name: "镜头", emoji: "🔍" },
  { name: "灯光", emoji: "💡" },
  { name: "配件", emoji: "🎒" },
  { name: "其他", emoji: "📦" },

  // 额外字段（不在顺序中但需要emoji）
  { name: "名字", emoji: "👤" },
  { name: "昵称", emoji: "👤" },
  { name: "真名", emoji: "📝" },
  { name: "胸围", emoji: "📐" },
  { name: "腰围", emoji: "📐" },
  { name: "臀围", emoji: "📐" },
];

// 从字段配置生成通用字段顺序
const universalFieldOrder = fieldConfig.map((field) => field.name);

// 从字段配置生成emoji映射
const emojiMap = {};
fieldConfig.forEach((field) => {
  emojiMap[field.name] = field.emoji;
});

// 为字段名添加emoji
function addEmojiToFieldName(fieldName) {
  const emoji = emojiMap[fieldName];
  return emoji ? `${emoji} ${fieldName}` : fieldName;
}

// 特定角色类型的字段顺序配置
const fieldOrder = {
  "{{user}}": ["行业等级", "想法", "堕落度", "穿搭", "器材"],
  女人: ["想法", "关系", "外型", "职业", "性爱"],
  关系: ["堕落度", "好感度"],
  外型: ["五官", "发型", "穿搭", "身高", "体重", "三围", "罩杯"],
  职业: ["类型", "层级", "方向", "尺度", "人设"],
  性爱: ["性癖", "性经验次数", "乳房敏感度", "小穴湿润度", "肛门松弛度"],
};

// 创建通用字段顺序的Set，提高查找性能
const universalFieldOrderSet = new Set(universalFieldOrder);

// 预计算字段顺序的Set，提高查找性能
const fieldOrderSets = {};
for (const [section, fields] of Object.entries(fieldOrder)) {
  fieldOrderSets[section] = new Set(fields);
}

// 检测角色类型的函数
function detectCharacterType(sectionName, sectionData) {
  // 检查是否包含用户特有字段
  const userFields = ["行业等级", "堕落度", "器材"];
  const hasUserFields = userFields.some(
    (field) => sectionData && sectionData.hasOwnProperty(field),
  );

  // 检查是否包含女性角色特有字段
  const womanFields = ["关系", "外型", "职业", "性爱", "昵称", "全名", "姓名"];
  const hasWomanFields = womanFields.some(
    (field) => sectionData && sectionData.hasOwnProperty(field),
  );

  // 检查是否为系统分类字段
  const systemFields = ["关系", "外型", "职业", "性爱"];
  const isSystemField = systemFields.includes(sectionName);

  if (hasUserFields || sectionName.includes("user") || sectionName.includes("小二")) {
    return "user";
  } else if (isSystemField) {
    return "system";
  } else if (hasWomanFields || (!hasUserFields && !isSystemField)) {
    return "woman";
  }

  return "unknown";
}

// 获取字段顺序的函数
function getFieldOrder(sectionName, sectionData = null) {
  // 优先使用精确匹配的特定配置
  if (fieldOrder[sectionName]) {
    return fieldOrder[sectionName];
  }

  // 基于内容检测角色类型
  const characterType = detectCharacterType(sectionName, sectionData);

  switch (characterType) {
    case "user":
      return fieldOrder["{{user}}"];
    case "woman":
      return fieldOrder["女人"];
    case "system":
      // 对于系统分类，尝试使用对应的配置
      if (fieldOrder[sectionName]) {
        return fieldOrder[sectionName];
      }
      return universalFieldOrder;
    default:
      return universalFieldOrder;
  }
}

// 获取字段顺序Set的函数
function getFieldOrderSet(sectionName, sectionData = null) {
  // 优先使用精确匹配的特定配置
  if (fieldOrderSets[sectionName]) {
    return fieldOrderSets[sectionName];
  }

  // 基于内容检测角色类型
  const characterType = detectCharacterType(sectionName, sectionData);

  switch (characterType) {
    case "user":
      return fieldOrderSets["{{user}}"] || new Set(fieldOrder["{{user}}"]);
    case "woman":
      return fieldOrderSets["女人"] || new Set(fieldOrder["女人"]);
    case "system":
      if (fieldOrderSets[sectionName]) {
        return fieldOrderSets[sectionName];
      }
      return universalFieldOrderSet;
    default:
      return universalFieldOrderSet;
  }
}

// 导出所有字段相关的功能
export {
  fieldConfig,
  universalFieldOrder,
  universalFieldOrderSet,
  emojiMap,
  addEmojiToFieldName,
  fieldOrder,
  fieldOrderSets,
  detectCharacterType,
  getFieldOrder,
  getFieldOrderSet,
};
