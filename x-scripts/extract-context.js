/**
 * White-X 上下文信息提取脚本（纯 STScript 实现）
 * 使用 STScript 读取变量，生成 XML 格式的上下文字符串
 * 并保存到 context 变量
 */

(async () => {
  try {
    console.log('📖 使用 STScript 加载状态栏数据...');
    
    // 使用 STscript 读取状态栏数据
    const statusBarRaw = await STscript('/getvar 状态栏');
    
    // 解析 JSON 数据
    let statusBarData;
    try {
      statusBarData = typeof statusBarRaw === 'string' ? JSON.parse(statusBarRaw) : statusBarRaw;
    } catch (e) {
      throw new Error(`无法解析状态栏数据: ${e.message}`);
    }
    
    if (!statusBarData || typeof statusBarData !== 'object') {
      throw new Error('状态栏数据格式无效');
    }
    
    console.log('✓ 状态栏数据加载成功');
    
    // 初始化上下文对象
    const contextData = {
      世界: {
        时间: null,
        地点: null,
      },
      用户: {
        拍摄任务: null,
        资金: null,
        堕落度: null,
      },
      女性角色: {},
    };

    // 提取世界信息
    if (statusBarData['世界']) {
      const worldData = statusBarData['世界'];
      contextData.世界.时间 = worldData['时间'] || null;
      contextData.世界.地点 = worldData['地点'] || null;
    }

    // 遍历数据查找用户和女性角色
    for (const [sectionName, sectionData] of Object.entries(statusBarData)) {
      if (sectionName === '世界') continue;
      
      if (typeof sectionData !== 'object' || sectionData === null) continue;

      // 检测是否为用户角色（有 "拍摄任务" 或 "资金" 字段）
      if ('拍摄任务' in sectionData || '资金' in sectionData) {
        // 提取用户的拍摄任务
        for (const [key, value] of Object.entries(sectionData)) {
          if (key.includes('拍摄任务')) {
            if (Array.isArray(value)) {
              contextData.用户.拍摄任务 = value;
            } else if (typeof value === 'object' && value !== null) {
              // 转换对象格式为数组
              contextData.用户.拍摄任务 = Object.keys(value)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(k => value[k]);
            }
            break;
          }
        }
        
        // 提取用户的资金
        if ('资金' in sectionData) {
          contextData.用户.资金 = sectionData['资金'];
        }
        
        // 提取用户的堕落度
        if ('堕落度' in sectionData) {
          contextData.用户.堕落度 = sectionData['堕落度'];
        }
      }
    }

    // 提取女性角色数据
    if (statusBarData['女人']) {
      for (const [characterName, characterData] of Object.entries(statusBarData['女人'])) {
        if (typeof characterData !== 'object' || characterData === null) continue;
        
        const womanInfo = {
          好感度: null,
          堕落度: null,
          动情程度: null,
          尺度: null,
          人设: null,
        };

        // 从关系子部分提取
        if (characterData['关系'] && typeof characterData['关系'] === 'object') {
          const relationship = characterData['关系'];
          womanInfo.好感度 = relationship['好感度'] !== undefined ? relationship['好感度'] : null;
          womanInfo.堕落度 = relationship['堕落度'] !== undefined ? relationship['堕落度'] : null;
          womanInfo.动情程度 = relationship['动情程度'] !== undefined ? relationship['动情程度'] : null;
          womanInfo.尺度 = relationship['尺度'] !== undefined ? relationship['尺度'] : null;
        }

        // 从直接字段提取人设（如果有的话）
        if ('人设' in characterData) {
          womanInfo.人设 = characterData['人设'];
        }

        contextData.女性角色[characterName] = womanInfo;
      }
    }

    // 生成 JSON 字符串（紧凑格式）
    const jsonString = JSON.stringify(contextData);

    // 组合为 XML 格式
    const context = `<context>
${jsonString}
</context>`;

    console.log('✓ 上下文提取成功');
    console.log('\n📋 上下文内容（格式化 JSON）:');
    console.log(JSON.stringify(contextData, null, 2));
    
    // 注入消息到对话
    console.log('\n📤 注入上下文到对话...');
    await STscript(`/inject position=after depth=-1 scan=true role=user ephemeral=true ${context}`);
    console.log('✓ 上下文注入成功');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    throw error;
  }
})();
