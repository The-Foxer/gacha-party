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
              <div v-if="hasTriggeredSkills(skill.data)" class="basic-skill-info">
                <SkillTriggerSection :skill-data="skill.data" :skill-names="skillNames"
                  :skill-data-details="skillDataDetails" :all-skills-data="allSkillsData"
                  :total-skills-data="totalSkillsData" :statuses-data="statusesData" :status-details="statusDetails"
                  :status-names="statusNames" />
              </div>

              <!-- 新增的AI和配置关联组件 -->
              <AiAndCfgSection v-if="skill.data.ai_and_cfg" :skill-id="skill.id" :skill-data="skill.data"
                :skill-ai-behavior-data="skillAiBehaviorData" :skill-names="skillNames"
                :skill-data-details="skillDataDetails" :all-skills-data="allSkillsData"
                :total-skills-data="totalSkillsData" :statuses-data="statusesData" :status-details="statusDetails"
                :status-names="statusNames" />

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
import AiAndCfgSection from './AiAndCfgSection.vue';
import AIBehaviorService from '@/data/AIBehaviorService.js';
import AIBehaviorSection from './AIBehaviorSection.vue';
import {
  skillTypeLabels
} from '@/utils/labelsConfig';

export default {
  name: 'SkillDetails',
  components: {
    SkillTriggerSection,
    AiAndCfgSection,
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
    const skillDataDetails = ref({});
    const allSkillsData = ref({});
    const totalSkillsData = ref({});
    const statusesData = ref({});
    const skillAiBehaviorData = ref({});
    const roleBasedAiBehaviors = ref({});
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

    // 建立技能阶段到实际技能ID的映射
    const buildSkillMapping = (character) => {
      const mapping = {};
      if (character.passive) mapping.passive = character.passive;
      if (character.skill1) mapping.skill1 = character.skill1;
      if (character.skill2) mapping.skill2 = character.skill2;
      if (character.skill3) mapping.skill3 = character.skill3;
      if (character.attack_skill) mapping.attack = character.attack_skill;
      if (character.XP) mapping.xp = character.XP;
      if (character.xp_manual) mapping.xp_manual = character.xp_manual;
      if (character.manualskill) mapping.manualskill = character.manualskill;
      if (character.skillattack) mapping.skillattack = character.skillattack;
      return mapping;
    };

    // 加载角色相关的AI行为
    const loadRoleBasedAiBehaviors = async (characterId) => {
      const aiBehaviors = {};
      const fullCharacterList = CharacterService.getFullCharacterListWithVariants(true);
      const character = fullCharacterList.find(char => char.id === characterId);

      if (!character) {
        console.error(`未找到角色ID: ${characterId}`);
        return aiBehaviors;
      }

      if (character.behavior) {
        const behaviorName = character.behavior;
        const behaviorConfig = AIBehaviorService.getBehaviorByName(behaviorName);

        if (behaviorConfig) {
          const parsedStages = {};
          Object.keys(behaviorConfig).forEach(stage => {
            const stageData = behaviorConfig[stage];
            parsedStages[stage] = AIBehaviorService.parseBehaviorTree(stageData);
          });

          aiBehaviors[behaviorName] = {
            behaviorName: behaviorName,
            stages: parsedStages
          };
        }
      }

      // 同时尝试加载升级形态的AI行为
      if (character.variantsInfo) {
        const isUpgrade = character.variantsInfo.isUpgrade;
        const starLevel = character.variantsInfo.starLevel;

        if (isUpgrade && starLevel > 0 && character.behavior) {
          const upgradeBehaviorName = `${character.behavior}_up${starLevel}`;
          const upgradeBehaviorConfig = AIBehaviorService.getBehaviorByName(upgradeBehaviorName);

          if (upgradeBehaviorConfig) {
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

        const [skillsJson, totalSkillsJson, statusesJson, aiBehaviorJson] = await Promise.all([
          loadJsonData('/skills_data.json'),
          loadJsonData('/total_skills_data.json'),
          loadJsonData('/statuses_data.json'),
          loadJsonData('/skill_ai_behavior_data.json')
        ]);

        allSkillsData.value = skillsJson;
        totalSkillsData.value = totalSkillsJson;
        statusesData.value = statusesJson;
        skillAiBehaviorData.value = aiBehaviorJson;

        const statusDetailMap = {};
        const statusDescMap = {};
        Object.keys(statusesJson).forEach(key => {
          statusDetailMap[key] = statusesJson[key];
          statusDescMap[key] = statusesJson[key].name || statusesJson[key].des || `未知状态 ${key}`;
        });
        statusDetails.value = statusDetailMap;

        const statusMap = {};
        Object.keys(statusesJson).forEach(key => {
          statusMap[key] = statusesJson[key].name || `未知状态 ${key}`;
        });
        statusNames.value = statusMap;

        const skillNameMap = {};
        const skillDesMap = {};

        Object.keys(totalSkillsJson).forEach(key => {
          skillNameMap[key] = totalSkillsJson[key].name || `未知技能 ${key}`;
          skillDesMap[key] = totalSkillsJson[key].description || '';
        });

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

        const skillEntries = [];

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

        const processedSkills = [];

        for (const skillEntry of skillEntries) {
          const skillId = skillEntry.id.toString();
          let skillInfo = {
            id: skillId,
            type: skillEntry.type,
            label: skillEntry.label
          };

          if (totalSkillsJson[skillId]) {
            const totalSkill = totalSkillsJson[skillId];
            skillInfo.name = totalSkill.name;
            skillInfo.description = totalSkill.description;
            skillInfo.cd = totalSkill.cd;
            skillInfo.unitorder = totalSkill.unitorder;
            skillInfo.level_initial = totalSkill.level_intitial;
            skillInfo.anti_level = totalSkill.anti_level;
            skillInfo.data = { ...totalSkill };
          } else {
            skillInfo.name = `技能 ${skillId}`;
            skillInfo.description = '暂无详细描述';
            skillInfo.data = {};
          }

          if (skillsJson[skillId]) {
            skillInfo.skillData = skillsJson[skillId];
          } else {
            skillInfo.skillData = null;
          }

          processedSkills.push(skillInfo);
          console.log('技能数据:', skillInfo);
        }

        roleBasedAiBehaviors.value = await loadRoleBasedAiBehaviors(characterId);

        return processedSkills;
      } catch (error) {
        console.error('获取角色技能失败:', error);
        return [];
      } finally {
        loading.value = false;
      }
    };

    const hasTriggeredSkills = (skillData) => {
      if (!skillData) return false;
      
      for (let i = 1; i <= 10; i++) {
        const skillField = `skill${i}`;
        if (skillData[skillField]) {
          return true;
        }
      }
      return false;
    };

    const loadSkills = async () => {
      skills.value = await getCharacterSkills(props.characterId);
    };

    const getSkillTypeLabel = (type) => {
      return skillTypeLabels[type] || `未知类型(${type})`;
    };

    onMounted(async () => {
      await loadSkills();
    });

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
      skillDataDetails,
      allSkillsData,
      totalSkillsData,
      statusesData,
      skillAiBehaviorData,
      roleBasedAiBehaviors,
      loading,
      debugMode,
      hasTriggeredSkills,
      getSkillTypeLabel
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
</style>