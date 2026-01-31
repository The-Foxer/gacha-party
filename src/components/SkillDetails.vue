<template>
  <div class="skill-details">
    <div v-if="loading" class="loading">
      <p>正在加载技能信息...</p>
    </div>

    <div v-else-if="skills.length > 0" class="content">
      <h3>技能详情</h3>

      <div class="skill-list">
        <div v-for="skill in skills" :key="skill.id" class="skill-item">
          <div class="skill-header">
            <h4>{{ skill.name || `技能 ${skill.id}` }}</h4>
            <span class="skill-type">{{ getSkillTypeLabel(skill.type) }}</span>
          </div>

          <div class="skill-content">
            <p v-if="skill.description" class="skill-description">{{ skill.description }}</p>

            <div class="skill-properties">
              <div class="property-row">
                <span v-if="skill.cd" class="property">
                  <strong>冷却时间:</strong> {{ skill.cd }}秒
                </span>
                <span v-if="skill.unitorder" class="property">
                  <strong>职业顺序:</strong> {{ skill.unitorder }}
                </span>
                <span v-if="skill.level_initial" class="property">
                  <strong>初始等级:</strong> {{ skill.level_initial }}
                </span>
                <span v-if="skill.anti_level" class="property">
                  <strong>反等级:</strong> {{ skill.anti_level }}
                </span>
              </div>
            </div>

            <div v-if="skill.data" class="skill-data">
              <!-- 基础技能信息 -->
              <div v-if="skill.skillData" class="basic-skill-info">
                <SkillTriggerSection :skill-data="skill.data" :skill-names="skillNames"
                  :skill-data-details="skillDataDetails" :all-skills-data="allSkillsData"
                  :total-skills-data="totalSkillsData" :statuses-data="statusesData" :status-details="statusDetails"
                  :status-names="statusNames" />
              </div>

              <!-- 新增的AI和配置关联组件 -->
              <AiAndCfgSection 
                v-if="skill.data.ai_and_cfg"
                :skill-id="skill.id"
                :skill-data="skill.data"
                :skill-ai-behavior-data="skillAiBehaviorData"
                :skill-names="skillNames"
                :skill-data-details="skillDataDetails"
                :all-skills-data="allSkillsData"
                :total-skills-data="totalSkillsData"
                :statuses-data="statusesData"
                :status-details="statusDetails"
                :status-names="statusNames"
              />

              <!-- 在SkillDetails.vue的模板中更新AIBehaviorSection组件的使用 -->
              <AIBehaviorSection v-if="roleBasedAiBehaviors" :skill-id="skill.id" :skill-type="skill.type"
                :role-based-ai-behaviors="roleBasedAiBehaviors" :debug-mode="debugMode" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-skills">
      <p>该角色暂无技能信息</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import CharacterService from '@/data/CharacterService.js';
import SkillTriggerSection from './SkillTriggerSection.vue';
import AiAndCfgSection from './AiAndCfgSection.vue'; // 新增导入
import AIBehaviorService from '@/data/AIBehaviorService.js';
import AIBehaviorSection from './AIBehaviorSection.vue';
import {
  statusTypeLabels,
  skillTypeLabels,
  skillTypeFromNumber,
  targetLabels,
  executeTypeLabels,
  specialAttackTypeLabels,
  judgeTypeLabels
} from '@/utils/labelsConfig';

export default {
  name: 'SkillDetails',
  components: {
    SkillTriggerSection,
    AiAndCfgSection, // 注册新组件
    AIBehaviorSection
  },
  props: {
    characterId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const skills = ref([]);
    const skillNames = ref({});
    const statusNames = ref({});
    const statusDetails = ref({});
    const statusDescriptions = ref({});
    const skillDataDetails = ref({});
    const derivedStatusEffects = ref({});
    const allSkillsData = ref({});
    const totalSkillsData = ref({});
    const statusesData = ref({});
    const skillAiBehaviorData = ref({}); // 新增：存储AI行为数据
    const roleBasedAiBehaviors = ref({});
    const skillMapping = ref({});
    const loading = ref(false);
    const debugMode = ref(true);

    // 加载JSON数据
    const loadJsonData = async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch ${url}:`, response.statusText);
          return {};
        }
        return await response.json();
      } catch (error) {
        console.error(`Error loading ${url}:`, error);
        return {};
      }
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

    // 获取状态类型名称
    const getStatusTypeName = (type) => {
      return statusTypeLabels[type] || `未知类型(${type})`;
    };

    // 获取技能类型名称（从数字）
    const getSkillTypeFromNumber = (type) => {
      return skillTypeFromNumber[type] || `未知类型(${type})`;
    };

    // 获取目标标签
    const getTargetLabel = (target) => {
      return targetLabels[target] || `未知目标(${target})`;
    };

    // 获取执行类型标签
    const getExecuteTypeLabel = (type) => {
      return executeTypeLabels[type] || `未知执行类型(${type})`;
    };

    // 获取特殊攻击类型标签
    const getSpecialAttackTypeLabel = (type) => {
      return specialAttackTypeLabels[type] || `未知特殊攻击类型(${type})`;
    };

    // 获取判定类型标签
    const getJudgeTypeLabel = (type) => {
      return judgeTypeLabels[type] || `未知判定类型(${type})`;
    };

    // 建立技能阶段到实际技能ID的映射
    // 建立技能阶段到实际技能ID的映射
    const buildSkillMapping = (character) => {
      const mapping = {};

      // 常见的AI行为阶段映射
      if (character.passive) mapping.passive = character.passive;
      if (character.skill1) mapping.skill1 = character.skill1;
      if (character.skill2) mapping.skill2 = character.skill2;
      if (character.skill3) mapping.skill3 = character.skill3;
      if (character.attack_skill) mapping.attack = character.attack_skill;
      if (character.XP) mapping.xp = character.XP;
      if (character.xp_manual) mapping.xp_manual = character.xp_manual; // XP手动技能
      if (character.manualskill) mapping.manualskill = character.manualskill;
      if (character.skillattack) mapping.skillattack = character.skillattack;

      //console.log('技能映射建立:', mapping);
      return mapping;
    };

    // 加载角色相关的AI行为
    const loadRoleBasedAiBehaviors = async (characterId) => {
      //console.log(`加载角色 ${characterId} 的AI行为`);
      const aiBehaviors = {};

      // 获取角色数据
      const fullCharacterList = CharacterService.getFullCharacterListWithVariants(true);
      const character = fullCharacterList.find(char => char.id === characterId);

      if (!character) {
        console.error(`未找到角色ID: ${characterId}`);
        return aiBehaviors;
      }

      // 根据角色的behavior字段加载主要AI行为
      if (character.behavior) {
        const behaviorName = character.behavior;
        //console.log(`尝试加载AI行为: ${behaviorName}`);

        const behaviorConfig = AIBehaviorService.getBehaviorByName(behaviorName);

        if (behaviorConfig) {
          //console.log(`成功加载AI行为: ${behaviorName}`);
          // 解析各个阶段
          const parsedStages = {};
          Object.keys(behaviorConfig).forEach(stage => {
            const stageData = behaviorConfig[stage];
            //console.log(`解析阶段 ${stage}, 数据长度: ${Array.isArray(stageData) ? stageData.length : 'N/A'}`);
            parsedStages[stage] = AIBehaviorService.parseBehaviorTree(stageData);
          });

          aiBehaviors[behaviorName] = {
            behaviorName: behaviorName,
            stages: parsedStages
          };

          //console.log(`${behaviorName} 包含阶段:`, Object.keys(parsedStages));
        } else {
          //console.log(`未找到AI行为: ${behaviorName}`);
        }
      }

      // 同时尝试加载升级形态的AI行为
      if (character.variantsInfo) {
        const isUpgrade = character.variantsInfo.isUpgrade;
        const starLevel = character.variantsInfo.starLevel;

        if (isUpgrade && starLevel > 0 && character.behavior) {
          // 尝试加载对应升级的AI行为 (如 ai_1010_up1)
          const upgradeBehaviorName = `${character.behavior}_up${starLevel}`;
          //console.log(`尝试加载升级AI行为: ${upgradeBehaviorName}`);

          const upgradeBehaviorConfig = AIBehaviorService.getBehaviorByName(upgradeBehaviorName);

          if (upgradeBehaviorConfig) {
            //console.log(`成功加载升级AI行为: ${upgradeBehaviorName}`);
            const parsedStages = {};
            Object.keys(upgradeBehaviorConfig).forEach(stage => {
              const stageData = upgradeBehaviorConfig[stage];
              parsedStages[stage] = AIBehaviorService.parseBehaviorTree(stageData);
            });

            aiBehaviors[upgradeBehaviorName] = {
              behaviorName: upgradeBehaviorName,
              stages: parsedStages
            };
          }
        }
      }

      //console.log(`为角色 ${characterId} 加载了 ${Object.keys(aiBehaviors).length} 个AI行为`);
      return aiBehaviors;
    };

    // 获取技能数据
    const getCharacterSkills = async (characterId) => {
      loading.value = true;

      try {
        const fullCharacterList = CharacterService.getFullCharacterListWithVariants(true);
        const character = fullCharacterList.find(char => char.id === characterId);

        if (!character) {
          console.error(`未找到角色ID: ${characterId}`);
          return [];
        }

        // 加载所有数据文件
        const [skillsJson, totalSkillsJson, statusesJson, aiBehaviorJson] = await Promise.all([
          loadJsonData('/skills_data.json'),
          loadJsonData('/total_skills_data.json'),
          loadJsonData('/statuses_data.json'),
          loadJsonData('/skill_ai_behavior_data.json') // 新增：加载AI行为数据
        ]);

        // 保存原始数据
        allSkillsData.value = skillsJson;
        totalSkillsData.value = totalSkillsJson;
        statusesData.value = statusesJson;
        skillAiBehaviorData.value = aiBehaviorJson; // 新增：保存AI行为数据

        // 创建状态效果详细信息映射
        const statusDetailMap = {};
        const statusDescMap = {};
        Object.keys(statusesJson).forEach(key => {
          statusDetailMap[key] = statusesJson[key];
          statusDescMap[key] = statusesJson[key].name || statusesJson[key].des || `未知状态 ${key}`;
        });
        statusDetails.value = statusDetailMap;
        statusDescriptions.value = statusDescMap;

        // 创建状态效果名称映射
        const statusMap = {};
        Object.keys(statusesJson).forEach(key => {
          statusMap[key] = statusesJson[key].name || `未知状态 ${key}`;
        });
        statusNames.value = statusMap;

        // 创建技能名称映射
        const skillNameMap = {};
        const skillDesMap = {};
        
        // 先处理总技能数据
        Object.keys(totalSkillsJson).forEach(key => {
          skillNameMap[key] = totalSkillsJson[key].name || `未知技能 ${key}`;
          skillDesMap[key] = totalSkillsJson[key].description || '';
        });
        
        // 再处理基础技能数据（优先级较低）
        Object.keys(skillsJson).forEach(key => {
          if (!skillNameMap[key]) {
            skillNameMap[key] = skillsJson[key].name || `未知技能 ${key}`;
          }
          if (!skillDesMap[key]) {
            skillDesMap[key] = skillsJson[key].des || '';
          }
        });
        
        skillNames.value = skillNameMap;
        skillDataDetails.value = skillDesMap;

        // 收集角色的所有技能ID
        const skillEntries = [];

        // 添加各种类型的技能
        if (character.passive) {
          skillEntries.push({ id: character.passive, type: 0, label: '被动技能' });
        }
        if (character.skill1) {
          skillEntries.push({ id: character.skill1, type: 3, label: '技能1' });
        }
        if (character.skill2) {
          skillEntries.push({ id: character.skill2, type: 3, label: '技能2' });
        }
        if (character.skill3) {
          skillEntries.push({ id: character.skill3, type: 3, label: '技能3' });
        }
        if (character.attack_skill) {
          skillEntries.push({ id: character.attack_skill, type: 1, label: '攻击技能' });
        }
        if (character.XP) {
          skillEntries.push({ id: character.XP, type: 2, label: 'XP技能' });
        }
        if (character.manualskill) {
          skillEntries.push({ id: character.manualskill, type: 3, label: '手动技能' });
        }

        //console.log('角色技能:', skillEntries);

        // 处理每个技能
        const processedSkills = [];

        for (const skillEntry of skillEntries) {
          const skillId = skillEntry.id.toString();
          let skillInfo = {
            id: skillId,
            type: skillEntry.type,
            label: skillEntry.label
          };

          // 首先查找总技能数据（包含技能名称和描述）
          if (totalSkillsJson[skillId]) {
            const totalSkill = totalSkillsJson[skillId];
            skillInfo.name = totalSkill.name;
            skillInfo.description = totalSkill.description;
            skillInfo.cd = totalSkill.cd;
            skillInfo.unitorder = totalSkill.unitorder;
            skillInfo.level_initial = totalSkill.level_intitial; // 注意这里拼写
            skillInfo.anti_level = totalSkill.anti_level;
            skillInfo.data = { ...totalSkill }; // 包含所有总技能数据
          } else {
            // 如果没有在总技能数据中找到，使用ID作为名称
            skillInfo.name = `技能 ${skillId}`;
            skillInfo.description = '暂无详细描述';
            skillInfo.data = {};
          }

          // 获取基础技能数据以获取详细描述
          if (skillsJson[skillId]) {
            skillInfo.skillData = skillsJson[skillId];
          } else {
            // 即使在基础技能数据中找不到，也要保留技能信息
            skillInfo.skillData = null;
          }

          processedSkills.push(skillInfo);
        }

        // 加载角色的AI行为
        roleBasedAiBehaviors.value = await loadRoleBasedAiBehaviors(characterId);

        //console.log('最终处理的技能:', processedSkills);
        return processedSkills;
      } catch (error) {
        console.error('获取角色技能失败:', error);
        return [];
      } finally {
        loading.value = false;
      }
    };

    const loadSkills = async () => {
      skills.value = await getCharacterSkills(props.characterId);
    };

    const getSkillTypeLabel = (type) => {
      return skillTypeLabels[type] || `未知类型(${type})`;
    };

    // 初始加载
    onMounted(async () => {
      await loadSkills();
    });

    // 监听角色ID变化并重新加载
    watch(
      () => props.characterId,
      async (newId, oldId) => {
        if (newId && newId !== oldId) {
          await loadSkills();
        }
      },
      { immediate: true }
    );

    return {
      skills,
      skillNames,
      statusNames,
      statusDetails,
      statusDescriptions,
      skillDataDetails,
      derivedStatusEffects,
      allSkillsData,
      totalSkillsData,
      statusesData,
      skillAiBehaviorData, // 新增返回
      roleBasedAiBehaviors,
      loading,
      debugMode,
      getSkillTypeLabel,
      getTargetLabel,
      getStatusTypeName,
      getSkillTypeFromNumber,
      getExecuteTypeLabel,
      getSpecialAttackTypeLabel,
      getJudgeTypeLabel,
      getDamageMultiplier
    };
  }
};
</script>

<style scoped>
.skill-details {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.skill-details h3 {
  color: #495057;
  margin-bottom: 15px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 5px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.skill-item {
  background-color: white;
  border-radius: 6px;
  border-left: 4px solid #007bff;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.skill-header h4 {
  margin: 0;
  color: #333;
}

.skill-type {
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  color: #6c757d;
}

.skill-description {
  color: #555;
  line-height: 1.5;
  margin: 8px 0;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9em;
}

.skill-properties {
  margin-top: 10px;
}

.property-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.property {
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.skill-data {
  margin-top: 10px;
}

.basic-skill-info,
.skill-trigger {
  margin-top: 10px;
  padding: 8px;
  background-color: #f1f3f4;
  border-radius: 4px;
}

.basic-skill-info h5,
.skill-trigger h5 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #495057;
  font-size: 1em;
}

.basic-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.info-item {
  background-color: #fff;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  font-size: 0.9em;
}

.base-description {
  margin-top: 10px;
  padding: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  font-size: 0.9em;
}

.base-description h6 {
  margin-top: 0;
  margin-bottom: 6px;
  color: #495057;
  font-size: 0.95em;
}

.base-description p {
  margin: 5px 0;
  color: #666;
}

.no-basic-info {
  padding: 10px;
  color: #6c757d;
  font-style: italic;
}

.no-skills {
  text-align: center;
  color: #6c757d;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

/* 调试信息样式 */
.debug-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
}

.debug-info h4 {
  margin-top: 0;
  color: #6c757d;
}

.debug-info ul {
  list-style-type: none;
  padding-left: 0;
}

.debug-info li {
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
}

.debug-info li:last-child {
  border-bottom: none;
}
</style>