// src/data/SkillService.js
import skillsData from '../../public/skills_data.json';

class SkillService {
  constructor() {
    this.skillsData = skillsData;
  }

  /**
   * 根据技能ID获取技能详细信息
   */
  getSkillById(skillId) {
    if (!skillId) return null;
    
    // 确保skillId是字符串类型，然后进行精确匹配
    const idStr = skillId.toString();
    
    // 使用 hasOwnProperty 确保是自身的属性，不是原型链上的
    if (Object.prototype.hasOwnProperty.call(this.skillsData, idStr)) {
      return this.skillsData[idStr];
    }
    
    // 如果没有找到，返回null
    return null;
  }

  /**
   * 根据多个技能ID批量获取技能信息
   */
  getSkillsByIds(skillIds) {
    if (!Array.isArray(skillIds)) return [];
    return skillIds.map(id => this.getSkillById(id)).filter(Boolean);
  }

  /**
   * 将技能ID转换为技能对象数组
   */
  parseSkillsFromCharacter(character) {
    const skills = [];
    
    // 提取角色中的所有技能字段
    const skillFields = [
      'passive', 'passive_up', 'skill1', 'skill2', 'skill3',
      'attack_skill', 'skillattack', 'XP', 'manualskill'
    ];

    skillFields.forEach(field => {
      if (character[field]) {
        // 假设技能字段存储的是技能ID字符串，如果是多个技能ID，以逗号分隔
        const skillIds = character[field].toString().split(',').map(id => id.trim());
        
        skillIds.forEach(skillId => {
          const skill = this.getSkillById(skillId);
          if (skill) {
            skills.push({
              field: field,
              fieldLabel: this.getFieldLabel(field),
              ...skill
            });
          }
        });
      }
    });

    return skills;
  }

  /**
   * 获取技能字段的显示标签
   */
  getFieldLabel(field) {
    const labels = {
      'passive': '被动技能',
      'passive_up': '被动升级',
      'skill1': '技能1',
      'skill2': '技能2',
      'skill3': '技能3',
      'attack_skill': '攻击技能',
      'skillattack': '技能攻击',
      'XP': 'XP技能',
      'manualskill': '手动技能'
    };
    return labels[field] || field;
  }

  /**
   * 解析技能类型
   */
  getSkillTypeLabel(skillType) {
    const types = {
      0: '被动技能',
      1: '主动技能',
      2: '大招/奥义',
      3: '特殊技能'
    };
    return types[skillType] || `未知类型(${skillType})`;
  }

  /**
   * 格式化技能描述
   */
  formatSkillDescription(skill) {
    if (!skill) return '';
    
    let description = skill.des || '无描述';
    
    // 可以根据需要添加更多格式化逻辑
    return description;
  }
}

export default new SkillService();