<template>
  <div class="character-list">
    <h1>角色列表</h1>
    
    <!-- 筛选器 -->
    <div class="filters">
      <div class="filter-group">
        <label>职业:</label>
        <select v-model="selectedCareer" @change="applyFilters">
          <option value="">全部</option>
          <option v-for="career in careerOptions" :key="career" :value="career">
            {{ getCareerLabel(career) }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>属性:</label>
        <select v-model="selectedAttr" @change="applyFilters">
          <option value="">全部</option>
          <option v-for="attr in attrOptions" :key="attr" :value="attr">
            {{ getAttrLabel(attr) }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>搜索:</label>
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="输入角色名或ID"
          @input="applyFilters"
        />
      </div>
      
      <div class="filter-group switch-group">
        <label class="switch-label">
          <input 
            type="checkbox" 
            v-model="showHiddenCharacters" 
            @change="applyFilters"
          />
          <span class="switch-text">显示隐藏角色</span>
        </label>
      </div>
    </div>
    
    <!-- 角色网格 -->
    <div class="character-grid">
      <div 
        v-for="character in displayedCharacters" 
        :key="character.id" 
        class="character-card"
        @click="goToCharacterDetail(character.id)"
      >
        <div class="character-info">
          <div class="id-row" :class="{ 'hidden-character': isHiddenCharacter(character.id) }">
            <span class="id-label">ID:</span>
            <span class="id-value">{{ character.id }}</span>
          </div>
          
          <div class="avatar-container">
            <img 
              :src="getAvatarSrc(character)" 
              :alt="character.name"
              class="avatar"
              @error="onImageError"
            />
          </div>

          <div class="name" :class="{ 'hidden-character': isHiddenCharacter(character.id) }">
            {{ character.name }}
          </div>
          
          <div class="type-row">
            <span class="attr">属性: {{ getAttrLabel(character.attr) }}</span>
            <span class="career">职业: {{ getCareerLabel(character.career) }}</span>
          </div>
          
        </div>
      </div>
    </div>
    
    <!-- 没有找到角色时的提示 -->
    <div v-if="displayedCharacters.length === 0" class="no-results">
      <p>没有找到匹配的角色</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import CharacterService from '@/data/CharacterService.js';

export default {
  name: 'CharacterList',
  setup() {
    const router = useRouter();
    
    // 筛选器状态
    const selectedCareer = ref('');
    const selectedAttr = ref('');
    const searchTerm = ref('');
    const showHiddenCharacters = ref(false); // 新增：是否显示隐藏角色的开关
    
    // 显示的角色列表
    const displayedCharacters = ref([]);
    
    // 选项
    const careerOptions = CharacterService.getCareers();
    const attrOptions = CharacterService.getAttrs();
    
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
    
    // 获取属性标签
    const getAttrLabel = (attr) => {
      return attrLabels[attr] || attr;
    };
    
    // 获取职业标签
    const getCareerLabel = (career) => {
      return careerLabels[career] || career;
    };
    
    // 获取头像地址
    const getAvatarSrc = (character) => {
      // 如果 role_image 存在则使用 role_image，否则使用 id
      const imageValue = character.role_image || character.id;
      return `/avater/${imageValue}.png`;
    };
    
    // 判断是否为隐藏角色
    const isHiddenCharacter = (characterId) => {
      return CharacterService.isHiddenCharacter(characterId);
    };
    
    // 应用筛选
    const applyFilters = () => {
      const filters = {};
      
      if (selectedCareer.value) {
        filters.career = selectedCareer.value;
      }
      
      if (selectedAttr.value) {
        filters.attr = selectedAttr.value;
      }
      
      if (searchTerm.value.trim()) {
        filters.search = searchTerm.value.trim();
      }
      
      displayedCharacters.value = CharacterService.filterCharacters(filters, showHiddenCharacters.value);
    };
    
    // 图片加载失败处理
    const onImageError = (event) => {
      event.target.src = '/avater/1704.png'; // 设置默认头像
    };
    
    // 跳转到角色详情页
    const goToCharacterDetail = (id) => {
      router.push(`/character/${id}`);
    };
    
    // 监听 showHiddenCharacters 的变化并应用筛选
    watch(showHiddenCharacters, () => {
      applyFilters(); // 当开关状态改变时重新应用筛选
    });
    
    onMounted(() => {
      // 初始化时应用筛选
      applyFilters();
    });
    
    return {
      selectedCareer,
      selectedAttr,
      searchTerm,
      showHiddenCharacters, // 返回新增的状态
      displayedCharacters,
      careerOptions,
      attrOptions,
      getAttrLabel,
      getCareerLabel,
      getAvatarSrc,
      applyFilters,
      onImageError,
      goToCharacterDetail,
      isHiddenCharacter
    };
  }
};
</script>

<style scoped>
.character-list {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.switch-group {
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.switch-text {
  user-select: none;
}

.filter-group label {
  font-weight: bold;
}

.filter-group select,
.filter-group input {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.character-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: #fff;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
  height: fit-content;
}

.character-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.character-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.id-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
}

.id-row.hidden-character {
  opacity: 0.6;
}

.id-label {
  font-size: 12px;
  color: #666;
}

.id-value {
  font-weight: bold;
  font-size: 14px;
}

.avatar-container {
  display: flex;
  justify-content: center;
}

.avatar {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eee;
}

.type-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
}

.attr, .career {
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  text-align: center;
}

.attr {
  background-color: #e3f2fd;
  color: #1976d2;
  align-self: flex-start;
}

.career {
  background-color: #f3e5f5;
  color: #7b1fa2;
  align-self: flex-start;
}

.name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  text-align: center;
  width: 100%;
  word-break: break-word;
}

.name.hidden-character {
  opacity: 0.6;
  font-style: italic;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

/* 响应式设计 - 移动端优化 */
@media (max-width: 768px) {
  .character-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  
  .character-card {
    padding: 10px;
  }
  
  .avatar {
    width: 60px;
    height: 60px;
  }
  
  .name {
    font-size: 14px;
  }
  
  .attr, .career {
    font-size: 11px;
    padding: 2px 4px;
  }
  
  .id-value {
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .character-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .character-card {
    padding: 8px;
  }
  
  .avatar {
    width: 50px;
    height: 50px;
  }
  
  .name {
    font-size: 12px;
  }
  
  .attr, .career {
    font-size: 10px;
    padding: 2px 3px;
  }
}
</style>