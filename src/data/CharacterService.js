// src/data/CharacterService.js
import { originalCharacters, careers, attrs, hiddenCharactersList, allValidCharacters, allCharacters } from './index.js';

class CharacterService {
  constructor() {
    this.originalCharacters = originalCharacters;
    this.allValidCharacters = allValidCharacters; // 包含隐藏角色的完整列表
    this.allCharacters = allCharacters; // 包含所有角色，包括皮肤和升级版
    this.hiddenCharactersList = hiddenCharactersList;
    this.careers = careers;
    this.attrs = attrs;
  }

  getAllCharacters(includeHidden = false) {
    if (includeHidden) {
      return this.allValidCharacters;
    }
    return this.originalCharacters;
  }

  getCareers() {
    return this.careers;
  }

  getAttrs() {
    return this.attrs;
  }

  isHiddenCharacter(characterId) {
    return this.hiddenCharactersList.includes(characterId);
  }

  filterCharacters(filters = {}, includeHidden = false) {
    let result = includeHidden ? [...this.allValidCharacters] : [...this.originalCharacters];
    
    if (filters.career) {
      result = result.filter(char => char.career === filters.career);
    }
    
    if (filters.attr) {
      result = result.filter(char => char.attr === filters.attr);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(char => 
        char.name.toLowerCase().includes(searchTerm) ||
        char.id.toLowerCase().includes(searchTerm)
      );
    }
    
    // 如果不包括隐藏角色，则过滤掉隐藏的角色
    if (!includeHidden) {
      result = result.filter(char => !this.hiddenCharactersList.includes(char.id));
    }
    
    return result;
  }

  // 获取基础ID（移除后缀如_skin、_up等）
  getBaseId(characterId) {
    if (!characterId) return characterId;
    
    // 移除常见的后缀
    return characterId
      .replace(/_skin.*$/, '')  // 移除_skin及其后续字符
      .replace(/_up.*$/, '')    // 移除_up及其后续字符
      .replace(/_big$/, '')     // 移除_big
      .replace(/90$/, '');      // 移除90结尾
  }

  // 获取星级信息
  getStarLevel(characterId) {
    const match = characterId.match(/_up(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  }

  // 提取皮肤名称
  extractSkinName(characterId) {
    const match = characterId.match(/^(.+)_skin(\d*)$/);
    if (match) {
      return match[1];
    }
    return characterId.includes('_skin') ? characterId : null;
  }

  // 新增：获取支持查询皮肤和星级的完整角色列表
  getFullCharacterListWithVariants(includeHidden = false) {
    let result = [...this.originalCharacters];
    
    // 添加所有皮肤
    const allSkins = this.allCharacters.filter(char => 
      char.id.includes('_skin') && !char.id.includes('_up')
    );
    result = result.concat(allSkins);
    
    // 添加所有升级版
    const allUpgrades = this.allCharacters.filter(char => 
      char.id.includes('_up') && !char.id.includes('_skin')
    );
    result = result.concat(allUpgrades);
    
    // 添加所有皮肤升级版
    const allSkinUpgrades = this.allCharacters.filter(char => 
      char.id.includes('_skin') && char.id.includes('_up')
    );
    result = result.concat(allSkinUpgrades);
    
    // 添加所有巨大化形态
    const allHuge = this.allCharacters.filter(char => 
      char.id.includes('_big') && !char.id.includes('_up')
    );
    result = result.concat(allHuge);
    
    // 添加巨大化升级版
    const allHugeUpgrades = this.allCharacters.filter(char => 
      char.id.includes('_big') && char.id.includes('_up')
    );
    result = result.concat(allHugeUpgrades);
    
    // 如果需要包含隐藏角色，则添加它们的变体
    if (includeHidden) {
      const hiddenVariants = this.allCharacters.filter(char => 
        this.hiddenCharactersList.some(hiddenId => 
          this.getBaseId(char.id) === this.getBaseId(hiddenId)
        )
      );
      result = result.concat(hiddenVariants);
    }
    
    // 过滤掉隐藏角色（除非明确要求包含）
    if (!includeHidden) {
      result = result.filter(char => !this.hiddenCharactersList.includes(this.getBaseId(char.id)));
    }
    
    // 为每个角色添加变体信息
    return result.map(char => {
      const baseId = this.getBaseId(char.id);
      const isSkin = char.id.includes('_skin');
      const isUpgrade = char.id.includes('_up');
      const isHuge = char.id.includes('_big');
      const starLevel = this.getStarLevel(char.id);
      const skinName = isSkin ? this.extractSkinName(char.id) : null;
      
      // 使用skin字段作为皮肤分类依据
      const skinField = char.skin || baseId;
      
      return {
        ...char,
        variantsInfo: {
          isSkin,
          isUpgrade,
          isHuge,
          baseId,
          skinName,
          starLevel,
          skinField, // 添加skin字段信息用于分类
          // 使用 role_image 来确定皮肤的实际名称
          actualSkinName: char.role_image && !char.id.includes('_up') && !char.id.includes('_big') 
                          ? char.role_image 
                          : skinName
        }
      };
    });
  }
}

export default new CharacterService();