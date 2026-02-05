<template>
  <div v-if="hasAiAndCfg" class="ai-and-cfg-section">
    <h5>AI与配置关联</h5>

    <div class="ai-config-info">
      <div class="config-entry">
        <strong>AI配置:</strong>
        <span class="ai-config-value">{{ skillData.ai_and_cfg }}</span>
      </div>

      <!-- 显示配置键名及其对应的技能 -->
      <div v-if="mappedSkills.length > 0" class="mapped-skills">
        <h6>配置键名对应的技能</h6>
        <ul>
          <li v-for="(mappedSkill, index) in mappedSkills" :key="index" class="mapped-skill">
            <div class="mapped-skill-header">
              <span class="config-key"><strong>配置键名:</strong> {{ mappedSkill.configKey }}</span>
              <span class="skill-ids" v-if="mappedSkill.skillIds.length > 0">
                <strong>技能ID:</strong> {{ mappedSkill.skillIds.join(', ') }}
              </span>
            </div>

            <!-- 展示每个技能的详细信息 -->
            <div v-for="skillId in mappedSkill.skillIds" :key="skillId" class="mapped-skill-details">
              <h6>技能ID: {{ skillId }}</h6>
              <div v-if="getSkillDataById(skillId)" class="skill-with-details">
                <!-- 直接显示技能详细信息 -->
                <div class="skill-trigger">
                  <div class="triggered-skill">
                    <div class="skill-header">
                      <span class="trigger-skill">技能:</span>
                      <span class="skill-id">{{ skillId }}</span>
                      <span v-if="skillNames[skillId]" class="skill-name"> - {{ skillNames[skillId] }}</span>
                    </div>

                    <!-- 显示技能的详细信息 -->
                    <div class="triggered-skill-details">
                      <!-- 从 total_skills_data 获取技能的基本信息 -->
                      <div v-if="getTotalSkillsData(skillId) && hasTotalSkillInfo(skillId)" class="total-skill-info">
                        <p><strong>描述:</strong> {{ getTotalSkillsData(skillId).description || '暂无描述' }}</p>
                        <p v-if="getTotalSkillsData(skillId).skill_description">
                          <strong>效果描述:</strong> {{ getTotalSkillsData(skillId).skill_description }}
                        </p>
                      </div>

                      <!-- 从 skills_data 获取技能的执行信息 -->
                      <div v-if="getSkillDataById(skillId) && hasBasicSkillInfo(skillId)" class="basic-skill-info">
                        <h6>基础技能信息</h6>
                        <ul>
                          <li v-if="getSkillDataById(skillId).exe_type">
                            <strong>执行类型:</strong> {{ getExecuteTypeLabel(getSkillDataById(skillId).exe_type) }}
                          </li>
                          <li v-if="getSkillDataById(skillId).exe_target">
                            <strong>执行目标:</strong> {{ getTargetLabel(getSkillDataById(skillId).exe_target) }}
                          </li>
                          <li v-if="getSkillDataById(skillId).insider_cd">
                            <strong>内置CD:</strong> {{ getSkillDataById(skillId).insider_cd }}秒
                          </li>
                          <li v-if="getSkillDataById(skillId).des">
                            <strong>描述:</strong> {{ getSkillDataById(skillId).des }}
                          </li>
                          <li v-if="getSkillDataById(skillId).skilltype">
                            <strong>技能类型:</strong> {{ getSkillTypeLabel(getSkillDataById(skillId).skilltype) }}
                          </li>
                        </ul>

                        <!-- 技能伤害倍率信息 -->
                        <div v-if="hasDamageInfoForSkill(skillId)" class="damage-info">
                          <h6>伤害倍率信息</h6>
                          <ul>
                            <li v-for="damageItem in getDamageItemsForSkill(skillId)" :key="`damage-${damageItem.index}`">
                              <span class="damage-effect">
                                <strong>效果{{ damageItem.index }}:</strong> 
                                <span v-if="getStatusDetails(damageItem.statusId)">
                                  ID: {{ damageItem.statusId }},
                                  类型: {{ getStatusTypeName(getStatusDetails(damageItem.statusId).status_type) }},
                                  倍率: {{ getDamageMultiplier(getStatusDetails(damageItem.statusId)) }}
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
                                <span v-if="getStatusDetails(effectItem.statusId)">
                                  ID: {{ effectItem.statusId }},
                                  {{ getStatusDetails(effectItem.statusId).name || '未知状态' }}
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
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <!-- 如果在skills_data中没有找到，显示提示信息 -->
                      <div v-if="!getSkillDataById(skillId)" class="no-skill-data">
                        <p>在基础技能数据中未找到此技能信息</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="no-skill-data">
                <p>在技能数据中未找到此技能: {{ skillId }}</p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import SkillService from '@/data/SkillService.js';
import { 
  targetLabels, 
  executeTypeLabels,
  statusTypeLabels,
  judgeTypeLabels,
  skillTypeLabels
} from '@/utils/labelsConfig';

export default {
  name: 'AiAndCfgSection',
  props: {
    skillId: {
      type: String,
      required: true
    },
    skillData: {
      type: Object,
      required: true
    },
    skillAiBehaviorData: {
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
  setup(props) {
    // 检查是否有ai_and_cfg
    const hasAiAndCfg = computed(() => {
      return !!props.skillData.ai_and_cfg;
    });

    // 映射配置键名到技能ID
    const mappedSkills = computed(() => {
      const mappings = [];

      if (props.skillAiBehaviorData && props.skillData.ai_and_cfg) {
        const cfg = props.skillAiBehaviorData[props.skillData.ai_and_cfg]?.cfg;
        const bullet = props.skillAiBehaviorData[props.skillData.ai_and_cfg]?.bullet;
        //console.log('cfg:', cfg);
        //console.log('bullet:', bullet);

        if (cfg) {
          // 遍历所有配置键名
          for (const cfgKey in cfg) {
            const cfgValue = cfg[cfgKey];
            
            if (typeof cfgValue === 'object' && cfgValue !== null) {
              const skillIds = [];

              // 从exe_tbl中提取技能ID
              if (cfgValue.exe_tbl && Array.isArray(cfgValue.exe_tbl)) {
                for (const exeItem of cfgValue.exe_tbl) {
                  if (exeItem.id) {
                    const skillId = exeItem.id.toString();
                    if (!skillIds.includes(skillId)) {
                      skillIds.push(skillId);
                    }
                  }
                }
              }

              // 递归查找嵌套的exe_tbl
              findSkillIdsInObject(cfgValue, skillIds);

              if (skillIds.length > 0) {
                mappings.push({
                  configKey: cfgKey,
                  skillIds: skillIds
                });
              }
            } 
            // 如果配置值本身就是技能ID
            else if (typeof cfgValue === 'string' && !isNaN(Number(cfgValue))) {
              mappings.push({
                configKey: cfgKey,
                skillIds: [cfgValue]
              });
            }
          }
        }
        // 处理 bullet 部分
    if (bullet) {
      for (const bulletKey in bullet) {
        const bulletValue = bullet[bulletKey];
        const skillIds = [];

        if (typeof bulletValue === 'object' && bulletValue !== null) {
          // 从 attack.exe_tbl 中提取技能 ID
          if (bulletValue.attack?.exe_tbl && Array.isArray(bulletValue.attack.exe_tbl)) {
            for (const exeItem of bulletValue.attack.exe_tbl) {
              if (exeItem.id) {
                const skillId = exeItem.id.toString();
                if (!skillIds.includes(skillId)) {
                  skillIds.push(skillId);
                }
              }
            }
          }

          // 递归查找嵌套的 exe_tbl
          findSkillIdsInObject(bulletValue, skillIds);
        }

        if (skillIds.length > 0) {
          mappings.push({
            configKey: `bullet.${bulletKey}`, // 区分 bullet 和 cfg 的键名
            skillIds: skillIds
          });
        }
      }
      }}

      return mappings;
    });

    // 在对象中递归查找技能ID
    function findSkillIdsInObject(obj, skillIds) {
      if (typeof obj === 'object' && obj !== null) {
        if (obj.exe_tbl && Array.isArray(obj.exe_tbl)) {
          for (const exeItem of obj.exe_tbl) {
            if (exeItem.id) {
              const skillId = exeItem.id.toString();
              if (!skillIds.includes(skillId)) {
                skillIds.push(skillId);
              }
            }
          }
        }

        for (const key in obj) {
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            findSkillIdsInObject(value, skillIds);
          }
        }
      }
    }

    // 使用SkillService获取技能数据
    const getSkillDataById = (skillId) => {
      const idStr = skillId.toString(); // 确保转换为字符串
      
      // 使用SkillService获取技能数据
      const skill = SkillService.getSkillById(idStr);
      
      // 如果在基础技能数据中找到了
      if (skill) {
        // 查看是否有总技能数据
        let combinedSkill = { ...skill };
        
        // 如果props中有totalSkillsData，也合并进去
        if (props.totalSkillsData && props.totalSkillsData[idStr]) {
          combinedSkill = {
            ...props.totalSkillsData[idStr],
            ...combinedSkill
          };
        }
        
        return combinedSkill;
      }
      
      // 如果没找到，创建一个基本结构
      const basicSkill = {
        id: idStr,
        name: props.skillNames[idStr] || `技能 ${idStr}`,
        description: '未找到技能详细数据'
      };
      
      return basicSkill;
    };

    // 获取总技能数据
    const getTotalSkillsData = (skillId) => {
      const idStr = skillId.toString();
      return props.totalSkillsData && props.totalSkillsData[idStr] ? props.totalSkillsData[idStr] : null;
    };

    // 获取标签配置
    const getTargetLabel = (target) => {
      return targetLabels[target] || `未知目标(${target})`;
    };
    
    const getExecuteTypeLabel = (type) => {
      return executeTypeLabels[type] || `未知执行类型(${type})`;
    };
    
    const getStatusTypeName = (type) => {
      return statusTypeLabels[type] || `未知类型(${type})`;
    };
    
    const getJudgeTypeLabel = (type) => {
      return judgeTypeLabels[type] || `未知判定类型(${type})`;
    };
    
    const getSkillTypeLabel = (type) => {
      return skillTypeLabels[type] || `未知类型(${type})`;
    };

    // 获取伤害倍率
    const getDamageMultiplier = (status) => {
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
    };

    // 检查是否有总技能信息
    const hasTotalSkillInfo = (skillId) => {
      const skill = getTotalSkillsData(skillId);
      return skill && (skill.description || skill.skill_description);
    };

    // 检查是否有基础技能信息
    const hasBasicSkillInfo = (skillId) => {
      const skill = getSkillDataById(skillId);
      return skill && (
        skill.exe_type || 
        skill.exe_target || 
        skill.insider_cd || 
        skill.des ||
        skill.skilltype ||
        hasStatusEffectsForSkill(skillId) ||
        hasDamageInfoForSkill(skillId) ||
        hasAdditionalEffectsForSkill(skillId) ||
        hasTriggerConditionsForSkill(skillId) ||
        hasRangeStatusForSkill(skillId)
      );
    };

    // 检查技能是否有伤害信息
    const hasDamageInfoForSkill = (skillId) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return false;
      
      for (let i = 1; i <= 10; i++) {
        const statusId = skill[`status_add${i}`];
        if (statusId && getStatusDetails(statusId)) {
          const status = getStatusDetails(statusId);
          if (status && (status.status_type === 101 || status.status_type === 102 || 
                 statusId.toString().startsWith('101') || statusId.toString().startsWith('102'))) {
            return true;
          }
        }
      }
      return false;
    };

    // 获取技能的伤害项
    const getDamageItemsForSkill = (skillId) => {
      const items = [];
      const skill = getSkillDataById(skillId);
      if (!skill) return items;
      
      for (let i = 1; i <= 10; i++) {
        const statusId = getDamageStatusForSkill(skillId, i);
        if (statusId) {
          items.push({
            index: i,
            statusId: statusId
          });
        }
      }
      return items;
    };

    // 获取技能的伤害状态
    const getDamageStatusForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return null;
      
      const statusId = skill[`status_add${index}`];
      return statusId && isDamageStatusForSkill(skillId, statusId) ? statusId : null;
    };

    // 检查技能状态是否为伤害状态
    const isDamageStatusForSkill = (skillId, statusId) => {
      const skill = getSkillDataById(skillId);
      if (!skill || !getStatusDetails(statusId)) return false;
      
      const status = getStatusDetails(statusId);
      return status && (status.status_type === 101 || status.status_type === 102 || 
             statusId.toString().startsWith('101') || statusId.toString().startsWith('102'));
    };

    // 检查技能是否有附加效果
    const hasAdditionalEffectsForSkill = (skillId) => {
      return getEffectItemsForSkill(skillId).length > 0;
    };

    // 获取技能的效果项
    const getEffectItemsForSkill = (skillId) => {
      const items = [];
      const skill = getSkillDataById(skillId);
      if (!skill) return items;
      
      for (let i = 1; i <= 10; i++) {
        const statusId = getNonDamageStatusForSkill(skillId, i);
        if (statusId) {
          items.push({
            index: i,
            statusId: statusId
          });
        }
      }
      return items;
    };

    // 获取技能的非伤害状态
    const getNonDamageStatusForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return null;
      
      const statusId = skill[`status_add${index}`];
      return statusId && !isDamageStatusForSkill(skillId, statusId) ? statusId : null;
    };

    // 获取技能的概率
    const getProbabilityForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return null;
      
      return skill[`status_prob${index}`];
    };

    // 获取技能的目标
    const getTargetForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return null;
      
      return skill[`status_target${index}`];
    };

    // 检查技能是否有触发条件
    const hasTriggerConditionsForSkill = (skillId) => {
      return getConditionItemsForSkill(skillId).length > 0;
    };

    // 获取技能的条件项
    const getConditionItemsForSkill = (skillId) => {
      const items = [];
      const skill = getSkillDataById(skillId);
      if (!skill) return items;
      
      for (let i = 1; i <= 10; i++) {
        const conditionType = getConditionTypeForSkill(skillId, i);
        if (conditionType) {
          items.push({
            index: i,
            conditionType: conditionType,
            conditionParam: getConditionParamForSkill(skillId, i),
            conditionTarget: getConditionTargetForSkill(skillId, i)
          });
        }
      }
      return items;
    };

    // 获取技能的条件类型
    const getConditionTypeForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return null;
      
      return skill[`status_judge_type${index}`];
    };

    // 获取技能的条件参数
    const getConditionParamForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return '';
      
      return skill[`status_judge_param${index}`] || '';
    };

    // 获取技能的条件目标
    const getConditionTargetForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return '';
      
      return skill[`status_judge_target${index}`] || '';
    };

    // 检查技能是否有范围状态
    const hasRangeStatusForSkill = (skillId) => {
      return getRangeItemsForSkill(skillId).length > 0;
    };

    // 获取技能的范围项
    const getRangeItemsForSkill = (skillId) => {
      const items = [];
      const skill = getSkillDataById(skillId);
      if (!skill) return items;
      
      for (let i = 1; i <= 10; i++) {
        const rangeStatus = getRangeStatusForSkill(skillId, i);
        if (rangeStatus) {
          items.push({
            index: i,
            rangeStatus: rangeStatus,
            maxNum: getMaxNumForSkill(skillId, i)
          });
        }
      }
      return items;
    };

    // 获取技能的范围状态
    const getRangeStatusForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return null;
      
      return skill[`range_status${index}`];
    };

    // 获取技能的最大数量
    const getMaxNumForSkill = (skillId, index) => {
      const skill = getSkillDataById(skillId);
      if (!skill) return null;
      
      return skill[`status_maxnum${index}`];
    };

    // 获取状态详情
    const getStatusDetails = (statusId) => {
      const idStr = statusId.toString();
      // 安全检查，确保props.statusesData存在
      return props.statusesData && props.statusesData[idStr] ? props.statusesData[idStr] : null;
    };

    return {
      hasAiAndCfg,
      mappedSkills,
      getSkillDataById,
      getTotalSkillsData,
      getTargetLabel,
      getExecuteTypeLabel,
      getStatusTypeName,
      getJudgeTypeLabel,
      getSkillTypeLabel,
      getDamageMultiplier,
      hasTotalSkillInfo,
      hasBasicSkillInfo,
      hasDamageInfoForSkill,
      getDamageItemsForSkill,
      getDamageStatusForSkill,
      isDamageStatusForSkill,
      hasAdditionalEffectsForSkill,
      getEffectItemsForSkill,
      getNonDamageStatusForSkill,
      getProbabilityForSkill,
      getTargetForSkill,
      hasTriggerConditionsForSkill,
      getConditionItemsForSkill,
      getConditionTypeForSkill,
      getConditionParamForSkill,
      getConditionTargetForSkill,
      hasRangeStatusForSkill,
      getRangeItemsForSkill,
      getRangeStatusForSkill,
      getMaxNumForSkill,
      getStatusDetails
    };
  }
};
</script>

<style scoped>
.ai-and-cfg-section {
  margin-top: 10px;
  padding: 8px;
  background-color: #e6f3ff;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.ai-and-cfg-section h5 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #007bff;
  font-size: 1em;
}

.config-entry {
  margin-bottom: 8px;
}

.ai-config-value {
  font-family: monospace;
  background-color: #d4ebff;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
}

.mapped-skills {
  margin-top: 10px;
}

.mapped-skills ul {
  list-style-type: none;
  padding-left: 0;
}

.mapped-skill {
  padding: 8px;
  margin: 5px 0;
  background-color: #e8f7ff;
  border-radius: 4px;
  border-left: 3px solid #17a2b8;
}

.mapped-skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 10px;
}

.config-key {
  font-weight: bold;
  color: #17a2b8;
}

.skill-ids {
  color: #007bff;
  font-style: italic;
}

.mapped-skill-details {
  margin-top: 8px;
}

.skill-with-details {
  margin-top: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.no-skill-data {
  margin-top: 8px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #6c757d;
  font-style: italic;
}

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

.status-effects {
  margin-top: 10px;
  padding: 8px;
  background-color: #e8f5e8;
  border-radius: 4px;
  font-size: 0.9em;
}

.status-effects h6 {
  margin-top: 0;
  margin-bottom: 6px;
  color: #28a745;
  font-size: 0.95em;
}

.status-effects ul {
  list-style-type: none;
  padding-left: 0;
}

.status-effects li {
  padding: 4px 0;
  border-bottom: 1px solid #c3e6cb;
  font-size: 0.85em;
}

.status-effects li:last-child {
  border-bottom: none;
}

.status-effect {
  color: #28a745;
  font-weight: bold;
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
</style>