<template>
  <div class="character-detail">
    <button @click="goBack" class="back-button">← 返回列表</button>
    
    <div v-if="character" class="character-container">
      <h1>{{ character.name }}</h1>
      
      <div class="character-header">
        <div class="image-section">
          <img 
            :src="getAvatarSrc(character)" 
            :alt="character.name"
            class="character-image"
            @error="onImageError"
          />
        </div>
        
        <div class="info-section">
          <div class="basic-info">
            <p><strong>ID:</strong> {{ character.id }}</p>
            <p>
              <strong>星级:</strong> 
              <span v-if="character.variantsInfo?.isHuge">巨大化</span>
              <span v-else-if="character.variantsInfo?.starLevel && character.variantsInfo.starLevel !== 0">
                {{ character.variantsInfo.starLevel }}星
              </span>
              <span v-else>0星</span>
            </p>
            <p><strong>皮肤:</strong> {{ character.skin || character.variantsInfo?.skinName || '无' }}</p>
            <p><strong>职业:</strong> {{ getCareerLabel(character.career) }}</p>
            <p><strong>属性:</strong> {{ getAttrLabel(character.attr) }}</p>
            <p><strong>费用:</strong> {{ character.cost }}</p>
            <p><strong>冷却时间:</strong> {{ character.cd }}秒</p>
            <p v-if="character.first_cd && character.first_cd > 0"><strong>首次冷却:</strong> {{ character.first_cd }}秒</p>
            <p><strong>模型大小:</strong> {{ character.modelscale || 1 }}</p>
            <p><strong>模型重量:</strong> {{ character.modelweight || 100 }}</p>
          </div>
        </div>
      </div>
      
      <!-- 变体切换选项卡 -->
      <div class="variants-section" v-if="hasVariants">
        <h2>角色形态</h2>
        <div class="variant-tabs">
          <!-- 基础形态区域 -->
          <div class="variant-group" v-if="baseStarVariants.length > 0">
            <h3>基础形态</h3>
            <div class="tab-buttons">
              <button 
                v-for="baseVariant in baseStarVariants" 
                :key="baseVariant.id"
                @click="switchVariant(baseVariant)"
                :class="['tab-btn', { active: currentVariantId === baseVariant.id }]"
              >
                <span v-if="baseVariant.variantsInfo.isHuge">巨大化</span>
                <span v-else-if="baseVariant.variantsInfo.starLevel && baseVariant.variantsInfo.starLevel !== 0">
                  {{ baseVariant.variantsInfo.starLevel }}星
                </span>
                <span v-else>0星</span>
              </button>
            </div>
          </div>

          <!-- 皮肤形态 - 按skin字段组织 -->
          <div class="variant-group" v-for="(skinGroup, skinField) in groupedSkinVariantsBySkin" :key="skinField">
            <h3 v-if="skinField !== character.variantsInfo.baseId">皮肤: {{ skinField }}</h3>
            <h3 v-else>基础皮肤</h3>
            <div class="tab-buttons">
              <button 
                v-for="skinVariant in skinGroup" 
                :key="skinVariant.id"
                @click="switchVariant(skinVariant)"
                :class="['tab-btn', { active: currentVariantId === skinVariant.id }]"
              >
                <span v-if="skinVariant.variantsInfo.isHuge">巨大化</span>
                <span v-else-if="skinVariant.variantsInfo.starLevel && skinVariant.variantsInfo.starLevel !== 0">
                  {{ skinVariant.variantsInfo.starLevel }}星
                </span>
                <span v-else>0星</span>
              </button>
            </div>
          </div>
          
          <!-- 巨大化形态 -->
          <div class="variant-group" v-if="hugeVariants.length > 0">
            <h3>巨大化形态</h3>
            <div class="tab-buttons">
              <button 
                v-for="hugeVariant in hugeVariants" 
                :key="hugeVariant.id"
                @click="switchVariant(hugeVariant)"
                :class="['tab-btn', { active: currentVariantId === hugeVariant.id }]"
              >
                <span v-if="hugeVariant.variantsInfo.starLevel && hugeVariant.variantsInfo.starLevel !== 0">
                  巨大化({{ hugeVariant.variantsInfo.starLevel }}星)
                </span>
                <span v-else>巨大化</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 星级提升说明 -->
      <div class="star-upgrade-section" v-if="starUpgrades.length > 0">
        <h2>星级提升说明</h2>
        <ul class="upgrade-list">
          <li v-for="(upgrade, index) in starUpgrades" :key="index" :class="`upgrade-${index + 1}`">
            <span class="upgrade-star">★ {{ index + 1 }}星：</span>
            <span class="upgrade-desc">{{ upgrade }}</span>
          </li>
        </ul>
      </div>
      
      <div class="stats-section">
        <h2>数值属性</h2>
        <div class="stats-grid">
          <p><strong>生命值系数:</strong> {{ character.hp_factor }}</p>
          <p><strong>攻击力系数:</strong> {{ character.atk_factor || 0 }}</p>
          <p><strong>支援力系数:</strong> {{ character.magic_factor || 0 }}</p>
          <p><strong>攻击评价:</strong> {{ character.attack_appraise_value }}</p>
          <p><strong>生命评价:</strong> {{ character.hp_appraise_value }}</p>
          <p><strong>移动速度:</strong> {{ character.movingspeed }}</p>
          <p><strong>攻击速度:</strong> {{ character.attackspeed }}</p>
          <p><strong>反作用力:</strong> {{ character.reforce || 1000 }}</p>
          <p><strong>破坏力:</strong> {{ character.wreck || 0 }}</p>
          <p><strong>恢复力:</strong> {{ character.wreck_recover || 3 }}</p>
          <p><strong>失衡时间:</strong> {{ character.imbalance_time || 5 }}秒</p>
          <p v-if="character.fire_defence"><strong>火焰抗性:</strong> {{ character.fire_defence }}</p>
          <p v-if="character.ice_defence"><strong>冰霜抗性:</strong> {{ character.ice_defence }}</p>
          <p v-if="character.frost_resistance"><strong>寒霜抗性:</strong> {{ character.frost_resistance }}</p>
        </div>
      </div>

      <!-- 攻击范围可视化 - 添加key确保组件重新渲染 -->
      <div class="range-section" v-if="character.range">
        <h2>攻击范围</h2>
        <RangeVisualizer 
          :rangeString="character.range" 
          :id="currentVariantId" 
          :key="`${currentVariantId}-range`"
        />
      </div>
      
      <div class="skills-section">
        <h2>技能信息</h2>
        <!-- 新增技能详情组件 -->
        <SkillDetails :characterId="currentVariantId" />
      </div>
      
      <div class="behavior-section">
        <h2>行为特征</h2>
        <div class="behavior-grid">
          <p><strong>行为模式:</strong> {{ character.behavior || '无' }}</p>
          <p><strong>攻击顺序:</strong> {{ character.attackunitorder || '0' }}</p>
          <p><strong>范围:</strong> {{ character.range || '无' }}</p>
          <p><strong>主键ID:</strong> {{ character.major }}</p>
        </div>
      </div>
      
      <div class="tags-section" v-if="hasTags">
        <h2>标签</h2>
        <div class="tags-list">
          <span v-if="character.tags" class="tag">标签: {{ character.tags }}</span>
          <span v-if="character.not_swap" class="tag">不可交换</span>
          <span v-if="character.recall" class="tag">可召回</span>
          <span v-if="character.anti_water" class="tag">防水</span>
          <span v-if="character.deep_water" class="tag">深水</span>
          <span v-if="character.fly" class="tag">飞行</span>
          <span v-if="character.can_plant_floor" class="tag">可种植地板: {{ character.can_plant_floor }}</span>
          <span v-if="character.role_entry" class="tag">角色入口: {{ character.role_entry }}</span>
          <span v-if="character.light_radius" class="tag">发光半径: {{ character.light_radius }}</span>
          <span v-if="character.special_look" class="tag">特殊外观: {{ character.special_look }}</span>
        </div>
      </div>
      
      <div class="description-section">
        <h2>介绍</h2>
        <p>{{ character.intro || '暂无介绍' }}</p>
      </div>
    </div>
    
    <div v-else class="error-message">
      <p>找不到角色信息</p>
      <button @click="goBack">返回列表</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CharacterService from '@/data/CharacterService.js';
import RangeVisualizer from '@/components/RangeVisualizer.vue';
import SkillDetails from '@/components/SkillDetails.vue'; // 新增导入
import AIBehaviorService from '@/data/AIBehaviorService.js';

export default {
  name: 'CharacterDetail',
  components: {
    RangeVisualizer,
    SkillDetails // 新增组件注册
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const character = ref(null);
    const currentVariantId = ref(null);
    
    // 调试模式
    const debugMode = ref(false);
    
    // AI行为相关
    const aiBehavior = ref(null);
    const aiBehaviorError = ref(null);

    // 属性标签映射
    const attrLabels = {
      'cake': '甜品',
      'dream': '梦境',
      'elec': '电玩',
      'music': '电音',
      'lizi': '微机',
      'item': '物品',
      'newyear': '新年',
      'fire': '火焰',
      'ice': '寒冰',
      'frige': '冷藏',
      'yike': '异客',
      'water': '流水',
      'cocoa': '可可',
      'lost': '幻梦',
      'game': '潮游',
      'gold': '金币',
      'exp': '经验',
      'eiji': '异界',
      'skill': '徽章',
      'fly': '飞行'
    };
    
    // 职业标签映射
    const careerLabels = {
      'all': '全部',
      'fighter': '战士',
      'cross': '穿透者',
      'assassin': '刺客',
      'shooter': '平射手',
      'cannon': '投掷手',
      'support': '治疗者',
      'tank': '坦克',
      'witcher': '增益者',
      'farmer': '生产者',
      'boom': '特殊',
      'throw': '投射',
      'abnormal': '异常',
      'fly': '飞行'
    };
    
    const loadCharacter = () => {
      const id = route.params.id;
      
      // 使用新的方法获取包含变体信息的完整角色列表
      const fullCharacterList = CharacterService.getFullCharacterListWithVariants(true);
      
      // 查找当前角色
      character.value = fullCharacterList.find(char => char.id === id) || null;
      currentVariantId.value = id;
    };
    
    // 获取所有变体（皮肤和升级形态）
    const variants = computed(() => {
      if (!character.value) return [];
      
      // 使用新的方法获取包含变体信息的完整角色列表
      const fullCharacterList = CharacterService.getFullCharacterListWithVariants(true);
      const currentBaseId = character.value.variantsInfo?.baseId || character.value.id.split('_')[0];
      const variantsArray = [];
      
      // 查找所有相关的变体
      for (const char of fullCharacterList) {
        if (char.variantsInfo?.baseId === currentBaseId) {
          variantsArray.push(char);
        }
      }
      
      // 去重逻辑
      const uniqueVariants = [];
      const seenIds = new Set();
      
      for (const variant of variantsArray) {
        if (!seenIds.has(variant.id)) {
          seenIds.add(variant.id);
          uniqueVariants.push(variant);
        }
      }
      
      return uniqueVariants;
    });
    
    // 基础形态（含升星）
    const baseStarVariants = computed(() => {
      if (!character.value) return [];
      
      return variants.value.filter(variant => {
        // 同一基础角色，非皮肤，非巨大化
        return variant.variantsInfo?.baseId === character.value.variantsInfo?.baseId && 
               !variant.variantsInfo?.isSkin && 
               !variant.variantsInfo?.isHuge;
      });
    });

    // 皮肤变体 - 按skin字段分组
    const groupedSkinVariantsBySkin = computed(() => {
      if (!character.value) return {};
      
      const skinVariants = variants.value.filter(variant => {
        // 有皮肤标识或skin字段与基础ID不同
        return variant.variantsInfo?.isSkin || 
               (variant.skin && variant.skin !== variant.variantsInfo?.baseId);
      });
      
      // 按skin字段分组并排序
      const grouped = {};
      skinVariants.forEach(variant => {
        // 使用skin字段作为皮肤名称的主要来源
        let skinField = variant.spine_model || variant.variantsInfo?.baseId;
        
        if (!grouped[skinField]) {
          grouped[skinField] = [];
        }
        grouped[skinField].push(variant);
      });
      
      // 对每组内的皮肤形态按类型排序（基础 -> 升级 -> 巨大化）
      Object.keys(grouped).forEach(skinField => {
        grouped[skinField].sort((a, b) => {
          // 优先级：基础皮肤 < 升级皮肤 < 巨大化皮肤
          const typeA = a.variantsInfo.isHuge ? 2 : (a.variantsInfo.isUpgrade ? 1 : 0);
          const typeB = b.variantsInfo.isHuge ? 2 : (b.variantsInfo.isUpgrade ? 1 : 0);
          
          if (typeA === typeB) {
            // 如果类型相同，按星级排序
            return (a.variantsInfo.starLevel || 0) - (b.variantsInfo.starLevel || 0);
          }
          return typeA - typeB;
        });
      });
      
      return grouped;
    });

    const hugeVariants = computed(() => {
      if (!character.value) return [];
      
      return variants.value.filter(variant => {
        // 是巨大化形态
        return variant.variantsInfo?.isHuge;
      });
    });
    
    // 获取星级提升说明
    const starUpgrades = computed(() => {
      if (!character.value) return [];
      
      // 按星级排序所有升级变体
      const upgrades = variants.value.filter(v => v.variantsInfo?.isUpgrade)
        .sort((a, b) => a.variantsInfo.starLevel - b.variantsInfo.starLevel);
      
      // 从1星开始匹配，直到找到对应的角色
      const result = [];
      for (let i = 1; i <= 5; i++) {
        const upgrade = upgrades.find(u => u.variantsInfo.starLevel === i);
        if (upgrade && upgrade.star_up_intro) {
          result.push(upgrade.star_up_intro);
        } else {
          result.push('暂无星级提升说明');
        }
      }
      
      return result;
    });
    
    // 是否有变体
    const hasVariants = computed(() => {
      return variants.value.length > 1;
    });
    
    // 切换变体
    const switchVariant = (variant) => {
      character.value = variant;
      currentVariantId.value = variant.id;
    };
    
    const getCareerLabel = (career) => {
      return careerLabels[career] || career;
    };
    
    const getAttrLabel = (attr) => {
      return attrLabels[attr] || attr;
    };
    
    const getAvatarSrc = (character) => {
      if (!character) return '/avater/1704.png';
      
      // 优先使用 role_image 字段
      let imageValue = character.role_image;
      
      // 如果没有 role_image，则根据角色类型构建图像路径
      if (!imageValue) {
        if (character.variantsInfo?.isSkin) {
          // 皮肤形态：使用皮肤名称或ID前缀
          if (character.variantsInfo?.skinName) {
            // 构建包含皮肤名和星级的图像路径
            const baseId = character.variantsInfo.baseId;
            const starLevel = character.variantsInfo.starLevel || 0;
            imageValue = `${baseId}_skin${character.variantsInfo.skinName}_${starLevel}`;
          } else {
            // 备用方案：使用ID
            imageValue = character.id;
          }
        } else if (character.variantsInfo?.isHuge) {
          // 巨大化形态
          const baseId = character.variantsInfo.baseId;
          const starLevel = character.variantsInfo.starLevel || 0;
          imageValue = `${baseId}_big_${starLevel}`;
        } else {
          // 基础形态
          const baseId = character.variantsInfo?.baseId || character.id.split('_')[0];
          const starLevel = character.variantsInfo?.starLevel || 0;
          if (starLevel > 0) {
            imageValue = `${baseId}_${starLevel}`;
          } else {
            imageValue = baseId;
          }
        }
      }
      
      // 确保图像路径格式正确
      const imagePath = `/avater/${imageValue}.png`;
      return imagePath;
    };
    
    const onImageError = (event) => {
      event.target.src = '/avater/1704.png'; // 设置默认头像
    };
    
    const goBack = () => {
      router.go(-1);
    };
    
    const hasTags = computed(() => {
      return character.value && (
        character.value.tags ||
        character.value.not_swap ||
        character.value.recall ||
        character.value.anti_water ||
        character.value.deep_water ||
        character.value.fly ||
        character.value.can_plant_floor ||
        character.value.role_entry ||
        character.value.light_radius ||
        character.value.special_look
      );
    });
    
    // 监听角色变化，当切换变体时更新组件
    watch(character, (newChar) => {
      if(newChar) {
        currentVariantId.value = newChar.id;
      }
    });
    
    onMounted(() => {
      loadCharacter();
    });

    // 加载AI行为数据
    const loadAIBehavior = async (character) => {
      aiBehaviorError.value = null;
      
      if (!character?.behavior) {
        aiBehavior.value = null;
        return;
      }
      
      try {
        //console.log('尝试加载行为数据:', character.behavior);
        
        // 获取行为配置
        const behaviorConfig = AIBehaviorService.getBehaviorByName(character.behavior);
        
        //console.log('获取到的行为配置:', behaviorConfig);
        
        if (behaviorConfig) {
          // 解析各个阶段
          const parsedStages = {};
          Object.keys(behaviorConfig).forEach(stage => {
            const stageData = behaviorConfig[stage];
            // 过滤掉空数组或null/undefined的阶段
            if (stageData && Array.isArray(stageData) && stageData.length > 0) {
              parsedStages[stage] = AIBehaviorService.parseBehaviorTree(stageData);
            } else {
              // 即使是空的也要保留结构，以便前端判断
              parsedStages[stage] = AIBehaviorService.parseBehaviorTree(stageData);
            }
          });
          
          aiBehavior.value = {
            behaviorName: character.behavior,
            stages: parsedStages
          };
          
          //console.log('解析后的AI行为:', aiBehavior.value);
        } else {
          aiBehavior.value = { 
            behaviorName: character.behavior,
            stages: {}
          };
          //console.log(`未找到行为配置: ${character.behavior}`);
        }
      } catch (error) {
        console.error('加载AI行为失败:', error);
        aiBehaviorError.value = error.message;
        aiBehavior.value = null;
      }
    };
    
    // 获取阶段标签
    const getStageLabel = (stageName) => {
      const stageLabels = {
        'xp_manual': 'XP技能手动',
        'skill1': '技能1',
        'skill2': '技能2', 
        'skill3': '技能3',
        'attack': '攻击',
        'idle': '待机',
        'move': '移动',
        'skillattack': '技能攻击'
      };
      
      return stageLabels[stageName] || stageName;
    };
    
    // 获取方法描述
    const getMethodDescription = (method) => {
      return AIBehaviorService.getMethodDescription(method);
    };
    
    // 格式化参数
    const formatParameter = (param) => {
      if (param === undefined || param === null) return '';
      if (typeof param === 'string') return param;
      if (Array.isArray(param)) return `[${param.length} 项]`;
      if (typeof param === 'object') return JSON.stringify(param);
      return String(param);
    };
    
    // 当角色变化时加载AI行为
    watch(character, (newChar) => {
      if (newChar) {
        loadAIBehavior(newChar);
      }
    }, { immediate: true });
    
    return {
      character,
      currentVariantId,
      baseStarVariants,
      groupedSkinVariantsBySkin, // 按skin字段分组的皮肤变体
      hugeVariants,
      starUpgrades, // 星级提升说明
      hasVariants,
      switchVariant,
      goBack,
      getCareerLabel,
      getAttrLabel,
      getAvatarSrc,
      onImageError,
      hasTags,
      aiBehavior,
      aiBehaviorError,
      debugMode, // 调试模式
      getStageLabel,
      getMethodDescription,
      formatParameter
    };
  }
};
</script>

<style scoped>
.character-detail {
  padding: 12px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

.back-button {
  margin-bottom: 20px;
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.back-button:hover {
  background-color: #0056b3;
}

.character-container {
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.character-container h1 {
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
  margin: 0 0 12px 0; /* 调整顶部边距 */
}

.character-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.image-section {
  flex: 0 0 200px;
}

.character-image {
  width: 100%;
  height: 200px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.info-section {
  flex: 1;
  min-width: 300px;
}

.basic-info p {
  margin: 8px 0;
  padding: 4px 0;
  line-height: 1.5;
}

.basic-info strong {
  color: #495057;
  min-width: 100px;
  display: inline-block;
}

.variants-section {
  margin: 20px 0;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.variant-group {
  margin-bottom: 20px;
}

.variant-group h3 {
  margin: 0 0 10px 0; /* 调整边距 */
  color: #495057;
  font-size: 1.1em;
}

.variant-tabs {
  margin-top: 10px;
}

.tab-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tab-btn {
  padding: 8px 12px;
  background-color: #e9ecef;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background-color: #dee2e6;
}

.tab-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.section-title {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  color: #495057;
  font-size: 1.2em;
}

.stats-section, 
.range-section,
.skills-section,
.behavior-section,
.tags-section,
.description-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.stats-grid, 
.skills-grid, 
.behavior-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.stats-grid p, 
.skills-grid p, 
.behavior-grid p {
  margin: 5px 0;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.tag {
  background-color: #e9ecef;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  color: #495057;
}

/* 新增：星级提升说明样式 */
.star-upgrade-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.upgrade-list {
  list-style-type: none;
  padding: 0;
  margin-top: 10px;
}

.upgrade-list li {
  padding: 8px 12px;
  margin-bottom: 5px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #ffc107;
  display: flex;
  align-items: flex-start;
}

.upgrade-list li.upgrade-1 { border-left-color: #ccc; }
.upgrade-list li.upgrade-2 { border-left-color: #aaa; }
.upgrade-list li.upgrade-3 { border-left-color: #ffd700; }
.upgrade-list li.upgrade-4 { border-left-color: #c0c0c0; }
.upgrade-list li.upgrade-5 { border-left-color: #daa520; }

.upgrade-star {
  font-weight: bold;
  color: #ff6b35;
  min-width: 60px;
  display: inline-block;
}

.upgrade-desc {
  flex: 1;
  color: #333;
}

.error-message {
  text-align: center;
  padding: 40px;
  color: #666;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.error-message button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ai-behavior-details {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.ai-behavior-details h3 {
  color: #28a745;
  margin-bottom: 15px;
}

.behavior-stages {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.behavior-stage {
  background-color: white;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.behavior-stage h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 5px;
}

.behavior-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.behavior-node {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.behavior-node.has-param {
  background-color: #f8f9fa;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9em;
}

.method {
  font-weight: bold;
  color: #007bff;
}

.param {
  color: #6c757d;
  font-family: monospace;
}

.param-details {
  margin-top: 8px;
  padding: 8px;
  background-color: #f1f3f4;
  border-radius: 4px;
  font-size: 0.8em;
}

.param-details pre {
  margin: 0;
  overflow-x: auto;
  white-space: pre-wrap;
}

.debug-info {
  background-color: #fff3cd;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  border: 1px solid #ffeaa7;
  font-size: 0.9em;
}

.no-behavior-data, .no-stage-data {
  padding: 10px;
  color: #6c757d;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #6c757d;
}

.behavior-error {
  padding: 10px;
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .character-header {
    flex-direction: column;
  }
  
  .image-section {
    flex: 0 0 auto;
  }
  
  .stats-grid, 
  .skills-grid, 
  .behavior-grid {
    grid-template-columns: 1fr;
  }
  
  .tab-buttons {
    display: flex;
    overflow-x: auto;
    white-space: nowrap;
    gap: 5px;
    padding: 5px 0;
  }
  
  .tab-btn {
    flex-shrink: 0;
    min-width: 80px;
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>