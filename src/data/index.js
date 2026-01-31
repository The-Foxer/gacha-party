import charactersRaw from '../../public/characters_data.json';

// 将原始数据转换为数组格式
const allCharacters = Object.values(charactersRaw);

// 隐藏角色列表（后续可以添加具体角色ID）
const hiddenCharactersList = [
    '1109',
    '1198',
    '4545',
    '6666',
    '1219',
]; // 暂时空着，可以添加如 ['some_hidden_char_id', 'another_hidden_char']

// 筛选出原始状态的角色（排除升级版和皮肤形态）
const originalCharacters = allCharacters.filter(char => {
  // 如果角色ID以 "_up" 结尾，说明是升级版，排除
  if (char.id.includes('_up')) {
    return false;
  }
  
  // 如果角色ID包含 "_skin" 或类似的皮肤标识，也排除
  if (char.id.includes('_skin') || char.id.includes('_big') || char.id.includes('90')) {
    return false;
  }
  
  // 如果角色有专门标识皮肤的字段，也可以检查
  if (char.type && (char.type.includes('skin'))) {
    return false;
  }
  
  return true;
});

// 获取所有唯一的职业和属性
const careers = [...new Set(originalCharacters.map(char => char.career))];
const attrs = [...new Set(originalCharacters.map(char => char.attr))];

// 完整的角色列表（包含可能被隐藏的角色）
const allValidCharacters = allCharacters.filter(char => {
  // 排除升级版
  if (char.id.includes('_up')) {
    return false;
  }
  
  // 排除皮肤
  if (char.id.includes('_skin')) {
    return false;
  }
  
  // 排除皮肤类型
  if (char.type && (char.type.includes('skin'))) {
    return false;
  }
  
  return true;
});

export {
  originalCharacters,
  careers,
  attrs,
  hiddenCharactersList,
  allValidCharacters, // 导出包含隐藏角色的完整列表
  allCharacters // 导出包含所有角色的完整列表
};