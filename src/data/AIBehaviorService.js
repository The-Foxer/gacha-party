// src/data/AIBehaviorService.js
import aiBehaviorDataRaw from '../../public/ai_behavior_data.json';

class AIBehaviorService {
  constructor() {
    // 处理数据格式问题
    if (Array.isArray(aiBehaviorDataRaw)) {
      // 将数组中的对象合并成一个对象
      this.behaviorData = {};
      aiBehaviorDataRaw.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          // 遍历每个顶级键值对
          Object.entries(item).forEach(([key, value]) => {
            this.behaviorData[key] = value;
          });
        }
      });
    } else if (typeof aiBehaviorDataRaw === 'object') {
      this.behaviorData = aiBehaviorDataRaw;
    } else {
      console.error('AI行为数据格式错误:', typeof aiBehaviorDataRaw);
      this.behaviorData = {};
    }
    
    //console.log('AI行为数据加载完成:', Object.keys(this.behaviorData));
  }

  /**
   * 根据行为名称获取AI行为配置
   */
  getBehaviorByName(behaviorName) {
    if (!behaviorName) return null;
    const result = this.behaviorData[behaviorName] || null;
    if (result) {
      //console.log(`找到AI行为: ${behaviorName}`, result);
    } else {
      //console.log(`未找到AI行为: ${behaviorName}`);
    }
    return result;
  }

  /**
   * 获取行为的各个阶段配置
   */
  getBehaviorStages(behaviorName) {
    const behavior = this.getBehaviorByName(behaviorName);
    if (!behavior) return {};
    
    const stages = {};
    Object.keys(behavior).forEach(stage => {
      stages[stage] = behavior[stage];
    });
    return stages;
  }

  /**
   * 递归解析复杂的行为树结构，保留完整数据结构
   */
  parseComplexNode(node, depth = 0) {
    if (depth > 10) { // 防止无限递归
      return { method: 'max_depth_reached', param: '...', type: 'depth_limit' };
    }

    if (Array.isArray(node)) {
      // 处理数组 - 递归解析每个元素
      return node.map(item => this.parseComplexNode(item, depth + 1));
    } else if (node !== null && typeof node === 'object') {
      // 检查是否是具有method属性的节点
      if (node.hasOwnProperty('method')) {
        return {
          method: node.method || 'unknown_method',
          param: this.deepClone(node.param), // 保留完整参数结构
          yield: node.yield,
          type: node.type,
          operator: node.operator,
          index: depth
        };
      } else if (node.hasOwnProperty('type')) {
        // 序列或选择器节点
        return {
          method: node.type || 'unknown_type',
          children: Array.isArray(node) ? node.map(child => this.parseComplexNode(child, depth + 1)) : [],
          param: this.deepClone(node.param),
          index: depth
        };
      } else {
        // 普通对象 - 转换为可读格式
        const result = { 
          method: 'object_property', 
          properties: [], 
          originalObject: this.deepClone(node), // 保存原始对象
          index: depth 
        };
        Object.entries(node).forEach(([key, value]) => {
          if (key !== 'index') { // 避免冲突
            result.properties.push({ 
              key, 
              value: this.deepClone(value) // 保留完整值结构
            });
          }
        });
        return result;
      }
    } else {
      // 基础类型
      return {
        method: 'literal_value',
        param: this.deepClone(node),
        index: depth
      };
    }
  }

  /**
   * 深度克隆函数，保留对象的完整结构
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  }

  /**
   * 解析参数值 - 保持原有功能但提供更多选项
   */
  parseNodeParam(param) {
    if (param === null || param === undefined) {
      return param;
    }
    
    if (Array.isArray(param)) {
      // 如果是数组，检查是否包含复杂对象
      return param.map(item => {
        if (typeof item === 'object' && item !== null) {
          // 尝试提取有意义的值，但保留完整对象
          if (item.hasOwnProperty('method')) {
            return item.method;
          } else if (item.hasOwnProperty('param')) {
            return item.param;
          } else if (item.hasOwnProperty('area')) {
            return item.area;
          } else if (item.hasOwnProperty('condition')) {
            return item.condition;
          } else if (item.hasOwnProperty('count')) {
            return item.count;
          } else if (item.hasOwnProperty('range')) {
            return item.range;
          } else if (item.hasOwnProperty('unitorder')) {
            return item.unitorder;
          } else {
            // 保留完整对象而不是字符串化
            return item;
          }
        }
        return item;
      });
    } else if (typeof param === 'object') {
      // 检查对象属性
      if (param.hasOwnProperty('method')) {
        return param.method;
      } else if (param.hasOwnProperty('param')) {
        return param.param;
      } else if (param.hasOwnProperty('area')) {
        return param.area;
      } else if (param.hasOwnProperty('condition')) {
        return param.condition;
      } else if (param.hasOwnProperty('count')) {
        return param.count;
      } else if (param.hasOwnProperty('range')) {
        return param.range;
      } else if (param.hasOwnProperty('unitorder')) {
        return param.unitorder;
      } else {
        // 保留完整对象
        return param;
      }
    }
    
    return param;
  }

  /**
   * 安全地解析行为树
   */
  parseBehaviorTree(behaviorArray) {
    if (!Array.isArray(behaviorArray)) {
      console.warn('输入不是数组:', behaviorArray);
      return [];
    }
    
    const parsedNodes = [];
    behaviorArray.forEach((node, index) => {
      try {
        const parsedNode = this.parseComplexNode(node, 0);
        // 如果是数组，展开其内容
        if (Array.isArray(parsedNode)) {
          parsedNodes.push(...parsedNode.map(n => ({...n, parentIndex: index})));
        } else {
          parsedNodes.push({...parsedNode, originalIndex: index});
        }
      } catch (error) {
        console.error('解析节点时出错:', node, error);
        parsedNodes.push({
          method: 'parse_error',
          param: JSON.stringify(node),
          originalIndex: index
        });
      }
    });
    
    return parsedNodes;
  }

  /**
   * 获取行为方法描述
   */
  getMethodDescription(method) {
    const descriptions = {
      'useSkill': '使用技能',
      'can_skill_usable': '检查技能可用性',
      'check_character_attribute': '检查角色属性',
      'lock_target_in_area': '锁定区域内目标',
      'lock_target_pool': '锁定目标池',
      'change_to_invincible': '变为无敌状态',
      'remove_invincible': '移除无敌状态',
      'wait': '等待',
      'set_turnback_limit': '设置转身限制',
      'lock_target_by_condition': '按条件锁定目标',
      'check_target_attribute': '检查目标属性',
      'lock_target': '锁定目标',
      'check_targetpool_hp_percent': '检查目标血量百分比',
      'sequence': '序列节点（依次执行）',
      'selector': '选择节点（执行第一个成功的）',
      'random': '随机节点',
      'condition': '条件节点',
      'object_property': '对象属性',
      'literal_value': '字面值',
      'complex_object': '复杂对象',
      'string_node': '字符串节点',
      'parse_error': '解析错误',
      'unknown_method': '未知方法',
      'unknown_type': '未知类型'
    };
    
    return descriptions[method] || method;
  }
  
  /**
   * 获取所有可用的AI行为名称
   */
  getAllBehaviorNames() {
    return Object.keys(this.behaviorData);
  }
}

export default new AIBehaviorService();