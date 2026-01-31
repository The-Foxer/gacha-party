<template>
  <div v-if="hasSkillRelatedAiBehavior(skillId, skillType)" class="skill-ai-behavior">
    <h5>技能相关AI行为</h5>
    <div class="ai-behavior-stages">
      <div v-for="(stage, stageName) in getAiBehaviorsForSkillType(skillType)" :key="stageName"
        class="ai-behavior-stage">
        <h6>{{ getStageLabel(stageName) }}</h6>

        <div v-if="stage && stage.length > 0" class="ai-behavior-tree">
          <div v-for="(node, index) in stage" :key="`${stageName}-${index}`" v-show="!isEmptyNode(node)"
            class="ai-behavior-node"
            :class="{ 'has-param': hasParam(node), 'nested-node': node.children || node.properties }">
            <!-- 主要方法描述 -->
            <div class="node-info">
              <!-- 显示方法，如果没有方法则显示节点类型或提示信息 -->
              <span v-if="node.method" class="method">{{ getMethodDescription(node.method) }}</span>
              <span v-else-if="node.originalObject" class="method unknown-node">未知节点类型</span>
              <span v-else-if="node.hasOwnProperty('param')" class="method param-node">参数节点</span>
              <!-- 空节点不会渲染到这里 -->

              <!-- 显示属性 -->
              <span v-if="node.properties && node.properties.length > 0" class="param">
                <span v-for="(prop, idx) in node.properties" :key="idx" class="property-item">
                  <template
                    v-if="isValueArray(typeof prop.value === 'object' ? prop.value.param || prop.value.method || prop.value : prop.value)">
                    <ul class="array-list-inline">
                      <li
                        v-for="(item, itemIdx) in getArrayValue(typeof prop.value === 'object' ? prop.value.param || prop.value.method || prop.value : prop.value)"
                        :key="itemIdx" class="array-item-inline">
                        <template v-if="isRangeValue(formatSimpleValue(item))">
                          <RangeVisualizer :range-string="extractRangeFromValue(formatSimpleValue(item))"
                            :id="`${stageName}-${index}-${idx}-${itemIdx}-range`" />
                        </template>
                        <template v-else>
                          {{ translateValue(formatSimpleValue(item)) }}
                        </template>
                        <span
                          v-if="itemIdx < getArrayValue(typeof prop.value === 'object' ? prop.value.param || prop.value.method || prop.value : prop.value).length - 1"><br></span>
                      </li>
                    </ul>
                  </template>
                  <template v-else>
                    <template
                      v-if="isRangeValue(translateValue(escapeHtml(formatParameterValue(typeof prop.value === 'object' ? prop.value.param || prop.value.method || JSON.stringify(prop.value) : prop.value))))">
                      <RangeVisualizer
                        :range-string="extractRangeFromValue(translateValue(escapeHtml(formatParameterValue(typeof prop.value === 'object' ? prop.value.param || prop.value.method || JSON.stringify(prop.value) : prop.value))))"
                        :id="`${stageName}-${index}-${idx}-range`" />
                    </template>
                    <template v-else>
                      {{ translateValue(escapeHtml(formatParameterValue(typeof prop.value === 'object' ? prop.value.param || prop.value.method || JSON.stringify(prop.value) : prop.value))) }}
                    </template>
                  </template>
                  <span v-if="idx < node.properties.length - 1">, </span>
                </span>
              </span>

              <!-- 显示参数（当没有属性时） -->
              <span v-else-if="hasParamContent(node)" class="param additional-info">
                {{ formatAdditionalParamInfo(node) }}
              </span>
            </div>

            <!-- 显示原始对象信息（调试用）
            <div v-if="debugMode && node.originalObject" class="debug-info">
              <small>原始对象: {{ JSON.stringify(node.originalObject) }}</small>
            </div> -->
          </div>
        </div>

        <div v-else class="no-ai-behavior-data">
          <p>此阶段暂无AI行为配置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AIBehaviorService from '@/data/AIBehaviorService.js';
import RangeVisualizer from './RangeVisualizer.vue';

export default {
  name: 'AIBehaviorSection',
  components: {
    RangeVisualizer
  },
  props: {
    skillId: {
      type: String,
      required: true
    },
    skillType: {
      type: Number, // 技能类型：0=被动, 1=攻击技能, 2=奥义, 3=主动技能
      required: true
    },
    roleBasedAiBehaviors: {
      type: Object,
      required: true
    },
    debugMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 定义技能类型到AI行为阶段的映射
      skillTypeMapping: {
        0: ['passive'], // 被动技能
        1: ['attack', 'attack_skill'], // 攻击技能
        2: ['xp', 'xp_manual'], // 奥义
        3: ['skill1', 'skill2', 'skill3', 'skillattack', 'manualskill'] // 主动技能
      }
    };
  },
  methods: {

    isEmptyNode(node) {
      // 判断是否为空节点：既没有method也没有originalObject或param属性，且没有其他有效内容
      return !node.method &&
        !node.originalObject &&
        !node.hasOwnProperty('param') &&
        !this.hasParamContent(node) &&
        (!node.properties || node.properties.length === 0);
    },

    hasParamContent(node) {
      return node.param !== undefined && node.param !== null ||
        node.yield !== undefined ||
        (node.hasOwnProperty('children') && node.children && node.children.length > 0);
    },

    // 格式化附加参数信息
    formatAdditionalParamInfo(node) {
      if (node.param !== undefined && node.param !== null) {
        if (typeof node.param === 'object') {
          return JSON.stringify(node.param);
        }
        return String(node.param);
      }
      if (node.yield !== undefined) {
        return `yield: ${node.yield}`;
      }
      if (node.children && Array.isArray(node.children)) {
        return `children: ${node.children.length} items`;
      }
      return '';
    },

    // 修改 hasParam 方法以适应更复杂的判断
    hasParam(node) {
      return node.param !== undefined && node.param !== null ||
        (node.properties && node.properties.length > 0) ||
        node.originalObject !== undefined ||
        node.yield !== undefined ||
        (node.children && node.children.length > 0);
    },
    
    // 检查是否有与技能类型相关的AI行为
    hasSkillRelatedAiBehavior(skillId, skillType) {
      //console.log(`检查技能类型 ${skillType} (${skillTypeLabels[skillType] || `未知类型(${skillType})`}) 是否有相关AI行为`);

      // 获取该技能类型对应的所有AI行为阶段
      const relatedStages = this.skillTypeMapping[skillType] || [];

      //console.log(`技能类型 ${skillType} 对应阶段:`, relatedStages);

      // 检查是否有任何AI行为包含这些阶段
      for (const behaviorName in this.roleBasedAiBehaviors) {
        const behavior = this.roleBasedAiBehaviors[behaviorName];
        if (behavior.stages) {
          for (const stage of relatedStages) {
            if (behavior.stages[stage]) {
              //console.log(`找到技能类型 ${skillType} (${skillTypeLabels[skillType]}) 的AI行为在 ${behaviorName} 的 ${stage} 阶段`);
              return true;
            }
          }
        }
      }

      //console.log(`技能类型 ${skillType} (${skillTypeLabels[skillType]}) 没有找到相关AI行为`);
      return false;
    },

    // 获取特定技能类型的AI行为
    getAiBehaviorsForSkillType(skillType) {
      //console.log(`获取技能类型 ${skillType} (${skillTypeLabels[skillType] || `未知类型(${skillType})`}) 的AI行为`);
      const skillBehaviors = {};

      // 获取该技能类型对应的所有AI行为阶段
      const relatedStages = this.skillTypeMapping[skillType] || [];

      //console.log(`技能类型 ${skillType} 对应阶段:`, relatedStages);

      // 查找所有AI行为中这些阶段的定义
      for (const behaviorName in this.roleBasedAiBehaviors) {
        const behavior = this.roleBasedAiBehaviors[behaviorName];
        if (behavior.stages) {
          for (const stage of relatedStages) {
            if (behavior.stages[stage]) {
              //console.log(`找到阶段 ${stage} 的AI行为: ${behaviorName}`);

              // 如果该阶段尚未添加到结果中，或者合并到现有阶段
              if (!skillBehaviors[stage]) {
                skillBehaviors[stage] = behavior.stages[stage];
              } else {
                // 如果已经存在，可以选择合并或覆盖
                // 这里我们简单地覆盖，如果有多个AI行为定义同一阶段
                skillBehaviors[stage] = behavior.stages[stage];
              }
            }
          }
        }
      }

      return skillBehaviors;
    },

    // 检查是否为复杂对象
    isComplexObject(param) {
      return param !== null &&
        typeof param === 'object' &&
        !Array.isArray(param) &&
        Object.keys(param).length > 0;
    },

    // 检查是否为非空数组
    isArrayWithContent(param) {
      return Array.isArray(param) && param.length > 0;
    },

    // 检查是否为对象或数组
    isObjectOrArray(param) {
      return param !== null && typeof param === 'object';
    },

    // 检查是否是对象的最后一个属性
    isLastProperty(obj, key) {
      const keys = Object.keys(obj);
      return keys[keys.length - 1] === key;
    },

    // 获取阶段标签
    getStageLabel(stageName) {
      const stageLabels = {
        'xp_manual': 'XP技能手动',
        'skill1': '技能1',
        'skill2': '技能2',
        'skill3': '技能3',
        'attack': '攻击',
        'idle': '待机',
        'move': '移动',
        'skillattack': '技能攻击',
        'xp': '奥义',
        'manualskill': '手动技能',
        'passive': '被动',
        'attack_skill': '攻击技能'
      };

      return stageLabels[stageName] || stageName;
    },

    // 获取方法描述
    getMethodDescription(method) {
      return AIBehaviorService.getMethodDescription(method);
    },

    // 检查是否为范围值
    isRangeValue(value) {
      if (typeof value !== 'string') {
        value = String(value);
      }

      // 检查是否符合范围格式，如 [(-50,-50)(50,50)] 或 [(-150,-150)(150,150)]
      const rangeRegex = /\[\s*\([-\d]+,[-\d]+\)\s*\([-\d]+,[-\d]+\)\s*\]/;
      return rangeRegex.test(value);
    },

    // 从值中提取范围字符串
    extractRangeFromValue(value) {
      if (typeof value !== 'string') {
        value = String(value);
      }

      // 提取范围部分，例如从 {"area":"[(-150,-150)(150,150)]"} 中提取 [(-150,-150)(150,150)]
      const rangeRegex = /\[\s*\([-\d]+,[-\d]+\)\s*\([-\d]+,[-\d]+\)\s*\]/;
      const match = value.match(rangeRegex);
      return match ? match[0] : value;
    },

    // 翻译值为中文
    translateValue(value) {
      if (typeof value !== 'string') {
        value = String(value);
      }

      // 定义值的中文映射
      const valueTranslations = {
        // 条件相关
        'nearest_goal': '最近的',
        'farest_goal': '最远的',
        'hp_lowest': '血量最少的',
        'hp_highest': '血量最多的',
        'row_select_limit': '行选择限制',
        'status_conf': '状态配置',
        'type': '类型',
        'exclude': '排除',
        'value': '值',
        'linkedPumpkin': '关联南瓜',
        'random': '随机',
        'all': '全部',
        'ally': '友军',
        'oponent': '敌人',
        'enemy': '敌人',
        'self': '自身',
        '120381': '布鲁缩小',
        'area': '范围',
        'skill': '技能',
        'lock': '锁定',
        'condition': '条件',
        'count': '数量',
        'target': '目标',
        'range': '范围',
        'unitorder': '单位顺序',
        'ignore_number': '忽略数量',
        'xp': '奥义',
        '\"': '',
        '{': '',
        '}': '',
        'model_conf': '模型配置',
        'charm_state': '魅惑状态',
        'abnormality': '异常状态',
        'not_include': '不包含',
        'charm': '魅惑',
        'frost': '冰冻',
        'jelly': '果冻',
        'pools': '池',
        'with_out_pool': '排除池',
        'buildings': '建筑物',
        'hp': '生命值',
        'hp_percent_lowest': '生命值百分比最低的',
        'nearest': '最近的',
        'teammate': '队友',
        'buff120213': '入场加速buff',
        'operator': '操作符',
        'statusName': '状态名称',
        'statusValue': '状态值',
        'can_plant_数量': '可种植数量',
        'buff120508': '调料罐反击buff',
        'portal_level': '传送门等级',
        '_percent_lowest': '百分比最低的',
        'customer_filter': '自定义过滤器',
        'attr': '属性',
        '_percent': '百分比',
        'op': '操作符',
        'check_slot_not_have_modelid': '检查槽位不具有模型ID',
        '11101_tm': '猫猫导弹'

      };

      // 尝试匹配精确值
      if (valueTranslations[value]) {
        return valueTranslations[value];
      }

      // 尝试处理包含关系（例如从JSON字符串中提取关键词）
      for (const [key, translation] of Object.entries(valueTranslations)) {
        if (value.includes(key) && key !== translation) { // 避免重复替换
          value = value.replace(new RegExp(key, 'g'), translation);
        }
      }

      return value;
    },

    // 检查值是否为数组
    isValueArray(value) {
      const actualValue = this.getActualValue(value);
      return Array.isArray(actualValue);
    },

    // 获取实际值（处理嵌套对象情况）
    getActualValue(value) {
      if (typeof value === 'object' && value !== null) {
        // 检查是否是包含param或method的对象
        if (value.param !== undefined) {
          return value.param;
        }
        if (value.method !== undefined) {
          return value.method;
        }
        // 直接返回值本身
        return value;
      }
      return value;
    },

    // 获取数组值
    getArrayValue(value) {
      const actualValue = this.getActualValue(value);
      return Array.isArray(actualValue) ? actualValue : [];
    },

    // HTML转义防止XSS
    escapeHtml(text) {
      if (text === null) return 'null';
      if (text === undefined) return 'undefined';
      if (typeof text === 'string') {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
      }
      return String(text);
    },

    // 简单格式化值（用于数组项目）
    formatSimpleValue(value) {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value.toString();
      if (typeof value === 'object') {
        // 如果对象本身是数组，递归处理
        if (Array.isArray(value)) {
          return '[' + value.map(item => this.formatSimpleValue(item)).join(', ') + ']';
        }
        // 否则转换为字符串
        return JSON.stringify(value);
      }
      return String(value);
    },

    // 格式化参数值
    formatParameterValue(value) {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'boolean') return value.toString();

      // 不再特别处理数组，因为现在在模板层面处理
      if (typeof value === 'object') {
        // 对于简单的对象，提取关键信息
        if (value.area) return value.area;
        if (value.condition) return this.getConditionLabel(value.condition);
        if (value.count) return value.count.toString();
        if (value.range) return value.range.toString();
        if (value.unitorder) return value.unitorder.toString();
        if (value.ignore_number) return value.ignore_number.toString;
        return JSON.stringify(value);
      }
      return String(value);
    },

    // 获取条件标签
    getConditionLabel(condition) {
      const conditionLabels = {
        'nearest': '最近的',
        'farest': '最远的',
        'farest_goal': '最远的目标',
        'hp_lowest': '血量最少的',
        'hp_highest': '血量最多的',
        'random': '随机',
        'all': '全部',
        'ally': '友军',
        'enemy': '敌人',
        'self': '自身',
      };

      return conditionLabels[condition] || condition;
    },

    // 获取键的标签（转换为人类可读格式）
    getKeyLabel(key) {
      const keyLabels = {
        'area': '范围',
        'condition': '优先级',
        'count': '数量',
        'target': '目标',
        'oponent': '敌人',
        'unitorder': '单位顺序',
        'range': '射程',
        'duration': '持续时间',
        'cd': '冷却时间',
        'skill': '技能',
        'method': '方法',
        'param': '参数',
        'yield': '返回值',
        'type': '类型',
        'operator': '操作符',
        'index': '索引',
        'value': '值',
        'key': '键',
        'children': '子节点',
        'properties': '属性',
        'originalObject': '原始对象',
        'ignore_number': '忽略数量'
      };

      return keyLabels[key] || key;
    },

    // 格式化参数
    formatParameter(param) {
      if (param === undefined || param === null) return '';
      if (typeof param === 'string') return param;
      if (Array.isArray(param)) return `[${param.length} 项]`;
      if (typeof param === 'object') {
        // 对于简单的对象，提取关键信息
        if (param.area) return `范围: ${param.area}`;
        if (param.condition) return `条件: ${param.condition}`;
        if (param.count) return `数量: ${param.count}`;
        if (param.range) return `范围: ${param.range}`;
        if (param.unitorder) return `单位顺序: ${JSON.stringify(param.unitorder)}`;
        return JSON.stringify(param).substring(0, 100) + (JSON.stringify(param).length > 100 ? '...' : '');
      }
      return String(param);
    },

    // 格式化属性
    formatProperties(properties) {
      if (!properties || !Array.isArray(properties)) return '';
      return properties.map(prop => `${prop.key}:${this.formatParameter(typeof prop.value === 'object' ? prop.value.param || prop.value.method || JSON.stringify(prop.value) : prop.value)}`).join(', ');
    },

    // 检查字符串是否为有效的JSON
    isJsonString(str) {
      if (typeof str !== 'string') return false;
      try {
        JSON.parse(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
};
</script>

<style scoped>
.skill-ai-behavior {
  margin-top: 15px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 6px;
  border-left: 4px solid #28a745;
}

.skill-ai-behavior h5 {
  color: #28a745;
  margin-top: 0;
  margin-bottom: 10px;
}

.ai-behavior-stages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-behavior-stage {
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #c3e6cb;
}

.ai-behavior-stage h6 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #155724;
  font-size: 0.95em;
  border-bottom: 1px solid #d4edda;
  padding-bottom: 4px;
}

.ai-behavior-tree {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-behavior-node {
  display: flex;
  flex-direction: column;
  padding: 6px;
  background-color: #fff;
  border: 1px solid #bce1c4;
  border-radius: 3px;
}

.ai-behavior-node.has-param {
  background-color: #f0fdf4;
}

.ai-behavior-node.nested-node {
  border-left: 2px solid #a3d9a5;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85em;
}

.method {
  font-weight: bold;
  color: #28a745;
}

.object-property {
  color: #6c757d;
  font-family: monospace;
  font-size: 0.8em;
}

.array-items-inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.array-item-inline {
  padding: 2px 0;
  color: #6c757d;
  font-family: monospace;
  font-size: 0.8em;
}

.item-value,
.item-complex {
  display: inline-block;
  margin-right: 8px;
}

.primitive-value {
  padding: 3px;
  font-family: monospace;
}

.param-details pre {
  margin: 0;
  overflow-x: auto;
  white-space: pre-wrap;
}

.no-ai-behavior-data {
  padding: 8px;
  color: #6c757d;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #6c757d;
  font-size: 0.9em;
}

.array-list {
  display: inline-block;
  margin: 0;
  padding-left: 15px;
  vertical-align: top;
}

.array-item {
  display: list-item;
  line-height: 1.2;
  margin: 2px 0;
}

.property-item {
  word-break: break-word;
  white-space: nowrap;
  font-weight: bold;
  color: #3ca354;
}

ul {
  padding-left: 0;
}

.array-list-inline {
  display: inline-block;
  margin: 0;
  padding: 0 5px;
}

.array-item-inline {
  display: inline;
  white-space: pre-wrap;
  margin: 0;
  padding: 0;
}

/* 添加新样式 */
.unknown-node {
  color: #888;
  font-style: italic;
}

.param-node {
  color: #666;
}

.empty-node {
  color: #ccc;
  font-size: 0.8em;
}

.additional-info {
  color: #6c757d;
  font-family: monospace;
  font-size: 0.8em;
  display: block;
  margin-top: 5px;
}
</style>