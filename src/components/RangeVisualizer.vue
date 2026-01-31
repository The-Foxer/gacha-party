<template>
  <div class="range-visualizer">
    <div class="grid-container-wrapper">
      <div 
        class="grid-container"
        :style="{
          width: containerSize.width + 'px',
          height: containerSize.height + 'px'
        }"
      >
        <div 
          v-for="rect in gridRectangles" 
          :key="rect.key"
          class="grid-cell"
          :class="{ 'character-cell': rect.isCharacter }"
          :style="{
            left: rect.x + 'px',
            top: rect.y + 'px',
            width: cellSize + 'px',
            height: cellSize + 'px',
            borderRadius: borderRadius + 'px',
            borderWidth: borderWidth + 'px'
          }"
        ></div>
      </div>
    </div>
    
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color attack-range"></div>
        <span>攻击范围</span>
      </div>
      <div class="legend-item">
        <div class="legend-color character"></div>
        <span>角色位置</span>
      </div>
    </div>
    
    <div class="range-text">
      <p><strong>原始数据:</strong> {{ rangeString }}</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'RangeVisualizer',
  props: {
    rangeString: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  setup(props) {
    // 方块尺寸常量
    const cellSize = 25; // 方块大小
    const spacing = 2;   // 方块间距
    const borderRadius = 5; // 圆角
    const borderWidth = 1;  // 边框宽度

    // 解析范围字符串
    const parseRangeString = (rangeStr) => {
      const matches = rangeStr.match(/\[([^\]]+)\]/g);
      if (!matches) return [];
      
      const rectangles = [];
      
      for (const match of matches) {
        const content = match.substring(1, match.length - 1);
        const coords = content.match(/\([^)]+\)/g);
        
        if (coords && coords.length >= 2) {
          const points = coords.map(coord => {
            const [x, y] = coord.substring(1, coord.length - 1).split(',').map(Number);
            return { x, y };
          });
          
          rectangles.push({
            x1: points[0].x,
            y1: points[0].y,
            x2: points[1].x,
            y2: points[1].y
          });
        }
      }
      
      return rectangles;
    };

    // 获取所有范围矩形
    const rectangles = parseRangeString(props.rangeString);

    // 计算所有格子位置
    const gridRectangles = computed(() => {
      const cells = new Map(); // 使用Map避免重复，key为"x,y"形式
      
      // 遍历每个矩形区域
      for (const rect of rectangles) {
        const startX = Math.floor(Math.min(rect.x1, rect.x2) / 100) * 100;
        const endX = Math.floor(Math.max(rect.x1, rect.x2) / 100) * 100;
        const startY = Math.floor(Math.min(rect.y1, rect.y2) / 100) * 100;
        const endY = Math.floor(Math.max(rect.y1, rect.y2) / 100) * 100;
        
        for (let x = startX; x <= endX; x += 100) {
          for (let y = startY; y <= endY; y += 100) {
            // 确保格子在矩形范围内
            if (x >= Math.min(rect.x1, rect.x2) && x <= Math.max(rect.x1, rect.x2) &&
                y >= Math.min(rect.y1, rect.y2) && y <= Math.max(rect.y1, rect.y2)) {
              const key = `${x},${y}`;
              if (!cells.has(key)) {
                cells.set(key, {
                  x: x,
                  y: -y, // Y轴翻转
                  key: key,
                  isCharacter: (x === 0 && y === 0) // 角色位于(0,0)
                });
              }
            }
          }
        }
      }

      // 确保角色位置始终存在
      const characterKey = "0,0";
      if (!cells.has(characterKey)) {
        cells.set(characterKey, {
          x: 0,
          y: 0,
          key: characterKey,
          isCharacter: true
        });
      }

      // 计算所有格子的边界
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const cell of cells.values()) {
        minX = Math.min(minX, cell.x);
        maxX = Math.max(maxX, cell.x);
        minY = Math.min(minY, cell.y);
        maxY = Math.max(maxY, cell.y);
      }
      
      // 计算格子数量以确定容器尺寸
      const cols = Math.ceil((maxX - minX) / 100) + 1;
      const rows = Math.ceil((maxY - minY) / 100) + 1;
      
      // 计算容器尺寸
      const width = cols * (cellSize + spacing);
      const height = rows * (cellSize + spacing);
      
      // 计算中心偏移
      const offsetX = -(minX + maxX) / 2;
      const offsetY = -(minY + maxY) / 2;
      
      // 将逻辑坐标转换为像素位置
      const result = Array.from(cells.values()).map(cell => {
        const gridX = Math.round((cell.x - minX) / 100);
        const gridY = Math.round((cell.y - minY) / 100);
        
        return {
          ...cell,
          x: gridX * (cellSize + spacing),
          y: gridY * (cellSize + spacing)
        };
      });
      
      return {
        cells: result,
        size: { width, height }
      };
    });

    // 最终的格子数据
    const finalGridRectangles = computed(() => gridRectangles.value.cells);
    
    // 容器尺寸
    const containerSize = computed(() => gridRectangles.value.size);

    return {
      gridRectangles: finalGridRectangles,
      containerSize,
      cellSize,
      borderRadius,
      borderWidth
    };
  }
};
</script>

<style scoped>
.range-visualizer {
  display: flex;
  flex-direction: column;
  align-items: center; /* 整体居中 */
  gap: 8px;
  width: 100%;
}

.grid-container-wrapper {
  display: flex;
  justify-content: center; /* 容器内部居中 */
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
}

.grid-container {
  position: relative;
  min-width: 25px;
  min-height: 25px;
  max-width: 250px;
  max-height: 250px;
  border: 1px solid #ddd;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: visible;
  border-radius: 4px;
}

.grid-cell {
  position: absolute;
  border-radius: 5px;
  border: 1px solid #3498db;
  box-sizing: border-box;
  z-index: 1;
  background-color: rgba(52, 152, 219, 0.5);
  transition: all 0.2s ease;
}

.grid-cell:hover {
  transform: scale(1.1);
  z-index: 3;
}

.character-cell {
  background-color: rgba(231, 76, 60, 0.6);
  border: 1px solid #c0392b;
  z-index: 2;
}

.legend {
  display: flex;
  gap: 10px;
  justify-content: center;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-color.attack-range {
  background-color: rgba(52, 152, 219, 0.5);
  border: 1px solid #3498db;
}

.legend-color.character {
  background-color: rgba(231, 76, 60, 0.6);
  border: 1px solid #c0392b;
}

.range-text {
  font-size: 11px;
  color: #666;
  word-break: break-all;
  max-width: 100%;
  text-align: center;
}

.range-text p {
  margin: 0;
}
</style>