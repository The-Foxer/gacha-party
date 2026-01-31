<template>
  <div v-if="hasTriggeredSkills" class="skill-trigger">
    <h5>触发技能</h5>
    <ul>
      <li v-for="(skillId, index) in triggeredSkillIds" :key="`trigger-${index}`">
        <div class="triggered-skill">
          <div class="skill-header">
            <span class="trigger-skill">技能{{ index + 1 }}:</span>
            <span class="skill-id">{{ skillId }}</span>
            <span v-if="skillNames[skillId]" class="skill-name"> - {{ skillNames[skillId] }}</span>
          </div>
          
          <!-- 显示触发技能的详细信息 -->
          <div class="triggered-skill-details">
            <!-- 从 total_skills_data 获取触发技能的基本信息 -->
            <div v-if="totalSkillsData[skillId] && hasTotalSkillInfo(skillId)" class="total-skill-info">
              <p><strong>描述:</strong> {{ totalSkillsData[skillId].description || '暂无描述' }}</p>
              <p v-if="totalSkillsData[skillId].skill_description">
                <strong>效果描述:</strong> {{ totalSkillsData[skillId].skill_description }}
              </p>
            </div>
            
            <!-- 从 skills_data 获取触发技能的执行信息 -->
            <div v-if="allSkillsData[skillId] && hasBasicSkillInfo(skillId)" class="basic-skill-info">
              <h6>基础技能信息</h6>
              <ul>
                <li v-if="allSkillsData[skillId].exe_type">
                  <strong>执行类型:</strong> {{ getExecuteTypeLabel(allSkillsData[skillId].exe_type) }}
                </li>
                <li v-if="allSkillsData[skillId].exe_target">
                  <strong>执行目标:</strong> {{ getTargetLabel(allSkillsData[skillId].exe_target) }}
                </li>
                <li v-if="allSkillsData[skillId].insider_cd">
                  <strong>内置CD:</strong> {{ allSkillsData[skillId].insider_cd }}秒
                </li>
                <li v-if="allSkillsData[skillId].des">
                  <strong>描述:</strong> {{ allSkillsData[skillId].des }}
                </li>
              </ul>
              
              <!-- 技能伤害倍率信息 -->
              <div v-if="hasDamageInfoForSkill(skillId)" class="damage-info">
                <h6>伤害倍率信息</h6>
                <ul>
                  <li v-for="damageItem in getDamageItemsForSkill(skillId)" :key="`damage-${damageItem.index}`">
                    <span class="damage-effect">
                      <strong>效果{{ damageItem.index }}:</strong> 
                      <span v-if="statusDetails[damageItem.statusId]">
                        ID: {{ damageItem.statusId }},
                        类型: {{ getStatusTypeName(statusDetails[damageItem.statusId].status_type) }},
                        倍率: {{ getDamageMultiplier(statusDetails[damageItem.statusId]) }}
                      </span>
                      <span v-else>
                        ID: {{ damageItem.statusId }} (未知状态)
                      </span>
                    </span>
                  </li>
                </ul>
              </div>
              
              <!-- 技能附带效果 -->
              <div v-if="hasAdditionalEffectsForSkill(skillId)" class="additional-effects">
                <h6>附带效果</h6>
                <ul>
                  <li v-for="effectItem in getEffectItemsForSkill(skillId)" :key="`effect-${effectItem.index}`">
                    <span>
                      <strong>效果{{ effectItem.index }}:</strong> 
                      <span v-if="statusNames[effectItem.statusId]">
                        ID: {{ effectItem.statusId }},
                        {{ statusNames[effectItem.statusId] }}
                      </span>
                      <span v-else>
                        ID: {{ effectItem.statusId }}
                      </span>
                      <span v-if="getProbabilityForSkill(skillId, effectItem.index)"> (概率: {{ getProbabilityForSkill(skillId, effectItem.index) }})</span>
                      <span v-if="getTargetForSkill(skillId, effectItem.index)"> (目标: {{ getTargetLabel(getTargetForSkill(skillId, effectItem.index)) }})</span>
                    </span>
                  </li>
                </ul>
              </div>
              
              <!-- 技能触发条件 -->
              <div v-if="hasTriggerConditionsForSkill(skillId)" class="trigger-conditions">
                <h6>触发条件</h6>
                <ul>
                  <li v-for="conditionItem in getConditionItemsForSkill(skillId)" :key="`condition-${conditionItem.index}`">
                    <span>
                      <strong>条件{{ conditionItem.index }}:</strong> 
                      {{ getJudgeTypeLabel(conditionItem.conditionType) }}:
                      {{ conditionItem.conditionParam }};
                      {{ conditionItem.conditionTarget }}
                    </span>
                  </li>
                </ul>
              </div>
              
              <!-- 技能范围状态 -->
              <div v-if="hasRangeStatusForSkill(skillId)" class="range-statuses">
                <h6>范围状态</h6>
                <ul>
                  <li v-for="rangeItem in getRangeItemsForSkill(skillId)" :key="`range-${rangeItem.index}`">
                    <div>
                      <span>
                        <strong>范围{{ rangeItem.index }}:</strong> 
                        {{ rangeItem.rangeStatus }}
                        <span v-if="rangeItem.maxNum"> (最大数量: {{ rangeItem.maxNum }})</span>
                      </span>
                      
                      <!-- 添加范围可视化组件 -->
                      <div v-if="rangeItem.rangeStatus && isRangeStringValid(rangeItem.rangeStatus)" class="range-visualization">
                        <RangeVisualizer 
                          :range-string="rangeItem.rangeStatus"
                          :id="`${skillId}-range-${rangeItem.index}`"
                        />
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- 如果在skills_data中没有找到，显示提示信息 -->
            <div v-if="!allSkillsData[skillId]" class="no-skill-data">
              <p>在基础技能数据中未找到此技能信息</p>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { 
  targetLabels, 
  executeTypeLabels,
  statusTypeLabels,
  judgeTypeLabels 
} from '@/utils/labelsConfig';
import RangeVisualizer from './RangeVisualizer.vue'; // 引入范围可视化组件

export default {
  name: 'SkillTriggerSection',
  components: {
    RangeVisualizer // 注册组件
  },
  props: {
    skillData: {
      type: Object,
      required: true
    },
    skillNames: {
      type: Object,
      required: true
    },
    skillDataDetails: {
      type: Object,
      required: true
    },
    allSkillsData: {
      type: Object,
      required: true
    },
    totalSkillsData: {
      type: Object,
      required: true
    },
    statusesData: {
      type: Object,
      required: true
    },
    statusDetails: {
      type: Object,
      required: true
    },
    statusNames: {
      type: Object,
      required: true
    }
  },
  computed: {
    hasTriggeredSkills() {
      return this.triggeredSkillIds.length > 0;
    },
    triggeredSkillIds() {
      const ids = [];
      // 检查所有可能的技能触发字段
      for (let i = 1; i <= 10; i++) {
        const skillField = `skill${i}`;
        if (this.skillData[skillField]) {
          ids.push(this.skillData[skillField].toString());
        }
      }
      return ids;
    }
  },
  methods: {
    getTargetLabel(target) {
      return targetLabels[target] || `未知目标(${target})`;
    },
    getExecuteTypeLabel(type) {
      return executeTypeLabels[type] || `未知执行类型(${type})`;
    },
    getStatusTypeName(type) {
      return statusTypeLabels[type] || `未知类型(${type})`;
    },
    getJudgeTypeLabel(type) {
      return judgeTypeLabels[type] || `未知判定类型(${type})`;
    },
    getDamageMultiplier(status) {
      if (status && status.value1) {
        // 如果是数字，表示倍率
        if (typeof status.value1 === 'number') {
          return status.value1;
        }
        // 如果是字符串，可能包含倍率信息
        if (typeof status.value1 === 'string') {
          const num = parseFloat(status.value1);
          if (!isNaN(num)) return num;
        }
        
        // 如果value1是百分比形式
        if (typeof status.value1 === 'string' && status.value1.includes('%')) {
          return status.value1;
        }
      }
      return status ? JSON.stringify(status) : '未知';
    },
    hasTotalSkillInfo(skillId) {
      const skill = this.totalSkillsData[skillId];
      return skill && (skill.description || skill.skill_description);
    },
    hasBasicSkillInfo(skillId) {
      const skill = this.allSkillsData[skillId];
      return skill && (
        skill.exe_type || 
        skill.exe_target || 
        skill.insider_cd || 
        skill.des ||
        this.hasStatusEffects(skillId) ||
        this.hasDamageInfoForSkill(skillId) ||
        this.hasAdditionalEffectsForSkill(skillId) ||
        this.hasTriggerConditionsForSkill(skillId) ||
        this.hasRangeStatusForSkill(skillId)
      );
    },
    hasStatusEffects(skillId) {
      for (let i = 1; i <= 10; i++) {
        if (this.allSkillsData[skillId][`status_add${i}`]) {
          return true;
        }
      }
      return false;
    },
    getStatusEffectItems(skillId) {
      const items = [];
      for (let i = 1; i <= 10; i++) {
        const statusId = this.allSkillsData[skillId][`status_add${i}`];
        if (statusId) {
          items.push({
            index: i,
            statusId: statusId,
            probability: this.allSkillsData[skillId][`status_prob${i}`],
            target: this.allSkillsData[skillId][`status_target${i}`]
          });
        }
      }
      return items;
    },
    
    // 检查技能是否有伤害信息
    hasDamageInfoForSkill(skillId) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return false;
      
      for (let i = 1; i <= 10; i++) {
        const statusId = skill[`status_add${i}`];
        if (statusId && this.statusDetails[statusId]) {
          const status = this.statusDetails[statusId];
          if (status && (status.status_type === 101 || status.status_type === 102 || 
                 statusId.toString().startsWith('101') || statusId.toString().startsWith('102'))) {
            return true;
          }
        }
      }
      return false;
    },
    
    // 获取技能的伤害项
    getDamageItemsForSkill(skillId) {
      const items = [];
      const skill = this.allSkillsData[skillId];
      if (!skill) return items;
      
      for (let i = 1; i <= 10; i++) {
        const statusId = this.getDamageStatusForSkill(skillId, i);
        if (statusId) {
          items.push({
            index: i,
            statusId: statusId
          });
        }
      }
      return items;
    },
    
    // 获取技能的伤害状态
    getDamageStatusForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return null;
      
      const statusId = skill[`status_add${index}`];
      return statusId && this.isDamageStatusForSkill(skillId, statusId) ? statusId : null;
    },
    
    // 检查技能状态是否为伤害状态
    isDamageStatusForSkill(skillId, statusId) {
      const skill = this.allSkillsData[skillId];
      if (!skill || !this.statusDetails[statusId]) return false;
      
      const status = this.statusDetails[statusId];
      return status && (status.status_type === 101 || status.status_type === 102 || 
             statusId.toString().startsWith('101') || statusId.toString().startsWith('102'));
    },
    
    // 检查技能是否有附加效果
    hasAdditionalEffectsForSkill(skillId) {
      return this.getEffectItemsForSkill(skillId).length > 0;
    },
    
    // 获取技能的效果项
    getEffectItemsForSkill(skillId) {
      const items = [];
      const skill = this.allSkillsData[skillId];
      if (!skill) return items;
      
      for (let i = 1; i <= 10; i++) {
        const statusId = this.getNonDamageStatusForSkill(skillId, i);
        if (statusId) {
          items.push({
            index: i,
            statusId: statusId
          });
        }
      }
      return items;
    },
    
    // 获取技能的非伤害状态
    getNonDamageStatusForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return null;
      
      const statusId = skill[`status_add${index}`];
      return statusId && !this.isDamageStatusForSkill(skillId, statusId) ? statusId : null;
    },
    
    // 获取技能的概率
    getProbabilityForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return null;
      
      return skill[`status_prob${index}`];
    },
    
    // 获取技能的目标
    getTargetForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return null;
      
      return skill[`status_target${index}`];
    },
    
    // 检查技能是否有触发条件
    hasTriggerConditionsForSkill(skillId) {
      return this.getConditionItemsForSkill(skillId).length > 0;
    },
    
    // 获取技能的条件项
    getConditionItemsForSkill(skillId) {
      const items = [];
      const skill = this.allSkillsData[skillId];
      if (!skill) return items;
      
      for (let i = 1; i <= 10; i++) {
        const conditionType = this.getConditionTypeForSkill(skillId, i);
        if (conditionType) {
          items.push({
            index: i,
            conditionType: conditionType,
            conditionParam: this.getConditionParamForSkill(skillId, i),
            conditionTarget: this.getConditionTargetForSkill(skillId, i)
          });
        }
      }
      return items;
    },
    
    // 获取技能的条件类型
    getConditionTypeForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return null;
      
      return skill[`status_judge_type${index}`];
    },
    
    // 获取技能的条件参数
    getConditionParamForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return '';
      
      return skill[`status_judge_param${index}`] || '';
    },
    
    // 获取技能的条件目标
    getConditionTargetForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return '';
      
      return skill[`status_judge_target${index}`] || '';
    },
    
    // 检查技能是否有范围状态
    hasRangeStatusForSkill(skillId) {
      return this.getRangeItemsForSkill(skillId).length > 0;
    },
    
    // 获取技能的范围项
    getRangeItemsForSkill(skillId) {
      const items = [];
      const skill = this.allSkillsData[skillId];
      if (!skill) return items;
      
      for (let i = 1; i <= 10; i++) {
        const rangeStatus = this.getRangeStatusForSkill(skillId, i);
        if (rangeStatus) {
          items.push({
            index: i,
            rangeStatus: rangeStatus,
            maxNum: this.getMaxNumForSkill(skillId, i)
          });
        }
      }
      return items;
    },
    
    // 获取技能的范围状态
    getRangeStatusForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return null;
      
      return skill[`range_status${index}`];
    },
    
    // 获取技能的最大数量
    getMaxNumForSkill(skillId, index) {
      const skill = this.allSkillsData[skillId];
      if (!skill) return null;
      
      return skill[`status_maxnum${index}`];
    },
    
    // 检查范围字符串是否有效
    isRangeStringValid(rangeString) {
      // 检查是否包含范围数据格式，例如 [(x,y),(x,y)]
      return typeof rangeString === 'string' && rangeString.includes('[') && rangeString.includes('(');
    }
  }
};
</script>

<style scoped>
.skill-trigger {
  margin-top: 10px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.skill-trigger h5 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #6c757d;
  font-size: 1em;
}

.skill-trigger ul {
  list-style-type: none;
  padding-left: 0;
}

.skill-trigger li {
  padding: 8px 0;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.9em;
}

.skill-trigger li:last-child {
  border-bottom: none;
}

.triggered-skill {
  margin-top: 8px;
}

.skill-header {
  font-weight: bold;
  color: #495057;
  margin-bottom: 5px;
}

.trigger-skill {
  font-weight: bold;
  color: #495057;
}

.skill-id {
  font-weight: bold;
  color: #007bff;
  margin: 0 5px;
}

.skill-name {
  color: #6c757d;
  font-style: italic;
}

.triggered-skill-details {
  margin-top: 5px;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
  border-left: 2px solid #007bff;
}

.total-skill-info {
  margin-bottom: 8px;
}

.total-skill-info p {
  margin: 4px 0;
  font-size: 0.9em;
}

.basic-skill-info {
  margin-top: 8px;
  padding: 5px;
}

.basic-skill-info h6 {
  margin-top: 0;
  margin-bottom: 6px;
  font-size: 0.95em;
}

.basic-skill-info ul {
  list-style-type: none;
  margin: 5px 0;
}

.basic-skill-info li {
  margin: 3px 0;
  font-size: 0.85em;
}

.status-effects-list {
  margin-top: 8px;
}

.status-effect {
  margin: 5px 0;
  padding: 3px 5px;
  background-color: #f1f3f4;
  border-radius: 3px;
  font-size: 0.85em;
  display: block;
}

.damage-info {
  margin-top: 10px;
  padding: 8px;
  background-color: #ffeef0;
  border-radius: 4px;
  font-size: 0.9em;
}

.damage-info h6 {
  margin-top: 0;
  margin-bottom: 6px;
  color: #dc3545;
  font-size: 0.95em;
}

.damage-info ul {
  list-style-type: none;
  padding-left: 0;
}

.damage-info li {
  padding: 4px 0;
  border-bottom: 1px solid #f5c6cb;
  font-size: 0.85em;
}

.damage-info li:last-child {
  border-bottom: none;
}

.damage-effect {
  color: #dc3545;
  font-weight: bold;
}

.additional-effects {
  margin-top: 10px;
  padding: 8px;
  background-color: #f0f8ff;
  border-radius: 4px;
  font-size: 0.9em;
}

.additional-effects h6 {
  margin-top: 0;
  margin-bottom: 6px;
  color: #007bff;
  font-size: 0.95em;
}

.additional-effects ul {
  list-style-type: none;
  padding-left: 0;
}

.additional-effects li {
  padding: 4px 0;
  border-bottom: 1px solid #b8daff;
  font-size: 0.85em;
}

.additional-effects li:last-child {
  border-bottom: none;
}

.trigger-conditions {
  margin-top: 10px;
  padding: 8px;
  background-color: #f0fff0;
  border-radius: 4px;
  font-size: 0.9em;
}

.trigger-conditions h6 {
  margin-top: 0;
  margin-bottom: 6px;
  color: #28a745;
  font-size: 0.95em;
}

.trigger-conditions ul {
  list-style-type: none;
  padding-left: 0;
}

.trigger-conditions li {
  padding: 4px 0;
  border-bottom: 1px solid #c3e6cb;
  font-size: 0.85em;
}

.trigger-conditions li:last-child {
  border-bottom: none;
}

.range-statuses {
  margin-top: 10px;
  padding: 8px;
  background-color: #fff8dc;
  border-radius: 4px;
  font-size: 0.9em;
}

.range-statuses h6 {
  margin-top: 0;
  margin-bottom: 6px;
  color: #ffc107;
  font-size: 0.95em;
}

.range-statuses ul {
  list-style-type: none;
  padding-left: 0;
}

.range-statuses li {
  padding: 4px 0;
  border-bottom: 1px solid #ffeaa7;
  font-size: 0.85em;
}

.range-statuses li:last-child {
  border-bottom: none;
}

/* 新增范围可视化样式 */
.range-visualization {
  margin-top: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.no-skill-data {
  padding: 5px;
  color: #6c757d;
  font-style: italic;
  font-size: 0.85em;
}
</style>