// ==================== 数独生成器 ====================
class SudokuGenerator {
    constructor(size) {
        this.size = size;
        // 6x6数独使用 2x3 宫格
        this.boxRows = 2;
        this.boxCols = 3;
    }

    // 生成完整数独
    generateComplete() {
        const grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.fillGrid(grid);
        return grid;
    }

    fillGrid(grid) {
        const empty = this.findEmpty(grid);
        if (!empty) return true;

        const [row, col] = empty;
        const numbers = this.shuffleArray(Array.from({length: this.size}, (_, i) => i + 1));

        for (const num of numbers) {
            if (this.isValid(grid, row, col, num)) {
                grid[row][col] = num;
                if (this.fillGrid(grid)) return true;
                grid[row][col] = 0;
            }
        }
        return false;
    }

    findEmpty(grid) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (grid[i][j] === 0) return [i, j];
            }
        }
        return null;
    }

    isValid(grid, row, col, num) {
        // 检查行
        for (let j = 0; j < this.size; j++) {
            if (grid[row][j] === num) return false;
        }

        // 检查列
        for (let i = 0; i < this.size; i++) {
            if (grid[i][col] === num) return false;
        }

        // 检查宫 (2x3)
        const boxRow = Math.floor(row / this.boxRows) * this.boxRows;
        const boxCol = Math.floor(col / this.boxCols) * this.boxCols;
        for (let i = 0; i < this.boxRows; i++) {
            for (let j = 0; j < this.boxCols; j++) {
                if (grid[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    // 挖空生成谜题
    createPuzzle(holes) {
        const solution = this.generateComplete();
        const puzzle = solution.map(row => [...row]);

        const positions = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                positions.push([i, j]);
            }
        }

        const shuffled = this.shuffleArray(positions);
        for (let i = 0; i < Math.min(holes, shuffled.length); i++) {
            const [row, col] = shuffled[i];
            puzzle[row][col] = 0;
        }

        return { solution, puzzle };
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// ==================== 战斗系统 ====================
class CombatSystem {
    constructor() {
        this.playerHP = 100;
        this.playerMaxHP = 100;
        this.playerShield = 0;

        this.enemyHP = 200;
        this.enemyMaxHP = 200;
        this.enemyAttack = 12;

        this.combo = 0;
        this.lastFilledNumber = 0;

        this.isFrozen = false; // 敌人是否被冰冻
        this.freezeTurns = 0;
    }

    // 根据数字计算战斗效果
    processNumber(num, cellElement) {
        let result = { num };

        // 检查数字类型
        if (num >= 1 && num <= 3) {
            // 守御 - 获得护盾
            this.playerShield += num;
            result = { ...result, type: 'defense', value: num };
        } else if (num >= 4 && num <= 6) {
            // 法术 - 中等伤害
            let damage = num * 5;
            if (num === 5) {
                // 素数额外易伤标记
                damage += 5;
            }
            this.dealDamageToEnemy(damage);
            result = { ...result, type: 'arcane', damage };
        } else {
            // 重击 - 高额伤害
            let damage = num * 10;
            const crit = num === 9 && Math.random() < 0.3;
            if (crit) damage *= 2;
            this.dealDamageToEnemy(damage);
            result = { ...result, type: 'power', damage, crit };
        }

        // 熵增效应：每填一个数，敌人攻击力微增
        this.enemyAttack = Math.min(50, this.enemyAttack + 0.5);

        return result;
    }

    dealDamageToEnemy(damage) {
        this.enemyHP = Math.max(0, this.enemyHP - damage);
    }

    addShield(amount) {
        this.playerShield += amount;
    }

    heal(amount) {
        this.playerHP = Math.min(this.playerMaxHP, this.playerHP + amount);
    }

    // 敌人回合
    enemyTurn() {
        if (this.isFrozen) {
            this.freezeTurns--;
            if (this.freezeTurns <= 0) {
                this.isFrozen = false;
            }
            return { frozen: true };
        }

        // 护盾抵消伤害
        const damage = Math.max(0, this.enemyAttack - this.playerShield);
        this.playerHP = Math.max(0, this.playerHP - damage);
        this.playerShield = Math.max(0, this.playerShield - this.enemyAttack);

        return { frozen: false, damage };
    }

    // 检查行是否完成
    checkRowComplete(grid, row) {
        const complete = grid[row].every(cell => cell !== 0);
        if (complete) {
            const sum = grid[row].reduce((a, b) => a + b, 0);
            const multiplier = 1 + this.combo * 0.15;
            const damage = Math.floor(sum * multiplier);
            this.dealDamageToEnemy(damage);
            this.combo++;
            return { complete, damage, combo: this.combo };
        }
        return { complete: false };
    }

    // 检查列是否完成
    checkColComplete(grid, col) {
        const complete = grid.every(row => row[col] !== 0);
        if (complete) {
            let sum = 0;
            for (let i = 0; i < grid.length; i++) {
                sum += grid[i][col];
            }
            const multiplier = 1 + this.combo * 0.15;
            const damage = Math.floor(sum * multiplier);
            this.dealDamageToEnemy(damage);
            this.combo++;
            return { complete, damage, combo: this.combo };
        }
        return { complete: false };
    }

    // 检查宫是否完成
    checkBoxComplete(grid, boxRow, boxCol) {
        const startRow = boxRow * 2;
        const startCol = boxCol * 3;
        let complete = true;
        let sum = 0;

        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 3; j++) {
                const val = grid[startRow + i][startCol + j];
                if (val === 0) complete = false;
                sum += val;
            }
        }

        if (complete) {
            this.dealDamageToEnemy(sum * 2);
            this.isFrozen = true;
            this.freezeTurns = 1;
            this.combo++;
            return { complete, damage: sum * 2, frozen: true, combo: this.combo };
        }
        return { complete: false };
    }

    isGameOver() {
        return this.playerHP <= 0 || this.enemyHP <= 0;
    }
}

// ==================== 遗物系统 ====================
class Relic {
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
}

const RELICS = [
    new Relic('goldbach', '哥德巴赫之吻', '两数之和为10时回血5点'),
    new Relic('euler', '欧拉之眼', '显示当前格子可能数字')
];

// ==================== 游戏主类 ====================
class Game {
    constructor() {
        this.size = 6; // 6x6 数独
        this.combat = new CombatSystem();
        this.relics = [RELICS[0]]; // 初始获得一个遗物

        this.solution = [];
        this.puzzle = [];
        this.userGrid = [];
        this.fixedCells = [];

        this.selectedCell = null;
        this.history = []; // 撤销历史

        this.init();
    }

    init() {
        // 生成 6x6 数独，挖空 18 格
        const gen = new SudokuGenerator(this.size);
        const { solution, puzzle } = gen.createPuzzle(18);
        this.solution = solution;
        this.puzzle = puzzle;
        this.userGrid = puzzle.map(row => [...row]);

        // 标记固定格子
        this.fixedCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.puzzle[i][j] !== 0) {
                    this.fixedCells.push(`${i}-${j}`);
                }
            }
        }

        this.render();
    }

    render() {
        this.renderCombatHUD();
        this.renderGrid();
        this.renderNumberPad();
        this.renderRelics();
    }

    renderCombatHUD() {
        // 玩家状态
        const playerPercent = (this.combat.playerHP / this.combat.playerMaxHP) * 100;
        document.getElementById('playerHPBar').style.width = playerPercent + '%';
        document.getElementById('playerHPText').textContent =
            `${Math.ceil(this.combat.playerHP)} / ${this.combat.playerMaxHP}`;
        document.getElementById('playerShield').textContent = this.combat.playerShield;

        // 敌人状态
        const enemyPercent = (this.combat.enemyHP / this.combat.enemyMaxHP) * 100;
        document.getElementById('enemyHPBar').style.width = enemyPercent + '%';
        document.getElementById('enemyHPText').textContent =
            `${Math.ceil(this.combat.enemyHP)} / ${this.combat.enemyMaxHP}`;
        document.getElementById('enemyAttack').textContent = Math.floor(this.combat.enemyAttack);

        // Combo
        document.getElementById('comboValue').textContent = this.combat.combo;
    }

    renderGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${this.size}, 55px)`;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                if (this.puzzle[i][j] !== 0) {
                    cell.classList.add('fixed');
                    cell.textContent = this.puzzle[i][j];
                } else if (this.userGrid[i][j] !== 0) {
                    cell.textContent = this.userGrid[i][j];
                    // 根据数字类型添加颜色
                    const num = this.userGrid[i][j];
                    if (num >= 1 && num <= 3) cell.classList.add('filled-defense');
                    else if (num >= 4 && num <= 6) cell.classList.add('filled-arcane');
                    else cell.classList.add('filled-power');
                }

                if (this.selectedCell && this.selectedCell.row === i && this.selectedCell.col === j) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', () => this.selectCell(i, j));
                grid.appendChild(cell);
            }
        }
    }

    renderNumberPad() {
        const numberPad = document.getElementById('numberPad');
        numberPad.innerHTML = '';
        for (let i = 1; i <= this.size; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = i;
            btn.onclick = () => this.fillNumber(i);
            numberPad.appendChild(btn);
        }
    }

    renderRelics() {
        const relicsBar = document.getElementById('relicsBar');
        relicsBar.innerHTML = '';
        this.relics.forEach(relic => {
            const div = document.createElement('div');
            div.className = 'relic';
            div.textContent = relic.name;
            div.title = relic.description;
            relicsBar.appendChild(div);
        });
    }

    selectCell(row, col) {
        this.selectedCell = { row, col };
        this.renderGrid();
    }

    fillNumber(num) {
        if (!this.selectedCell) return;
        const { row, col } = this.selectedCell;

        // 检查是否是固定格子
        if (this.fixedCells.includes(`${row}-${col}`)) return;

        // 验证填入是否合法
        const valid = this.isValidMove(row, col, num);
        if (!valid) {
            // 错误填入，扣血并触发敌人回合
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('enemy');
            setTimeout(() => cell.classList.remove('enemy'), 300);

            const damage = Math.ceil(this.combat.enemyAttack * 0.5);
            this.combat.playerHP = Math.max(0, this.combat.playerHP - damage);
            this.showFloatText(`-${damage}`, 'damage', cell);
            this.renderCombatHUD();

            if (this.combat.playerHP <= 0) {
                this.showResult(false);
            }
            return;
        }

        // 保存历史
        this.history.push({
            row, col,
            oldValue: this.userGrid[row][col],
            newValue: num
        });

        // 填入数字
        this.userGrid[row][col] = num;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = num;

        // 根据数字类型添加颜色
        if (num >= 1 && num <= 3) cell.classList.add('filled-defense');
        else if (num >= 4 && num <= 6) cell.classList.add('filled-arcane');
        else cell.classList.add('filled-power');

        // 触发战斗效果
        const result = this.combat.processNumber(num, cell);
        this.showFloatTextForResult(result, cell);

        // 检查哥德巴赫之吻遗物
        if (this.relics.find(r => r.id === 'goldbach')) {
            if (this.combat.lastFilledNumber + num === 10) {
                this.combat.heal(5);
                this.showFloatText('+5', 'heal', cell);
                this.renderCombatHUD();
            }
        }
        this.combat.lastFilledNumber = num;

        // 检查逻辑连锁
        this.checkLogicChains(row, col);

        // 更新UI
        this.renderCombatHUD();

        // 检查游戏结束
        if (this.combat.enemyHP <= 0) {
            this.showResult(true);
            return;
        }

        // 敌人回合
        const enemyResult = this.combat.enemyTurn();
        if (!enemyResult.frozen) {
            this.showFloatText(`-${enemyResult.damage}`, 'damage',
                document.querySelector('.combat-hud .fighter.player'));
        }
        this.renderCombatHUD();

        if (this.combat.playerHP <= 0) {
            this.showResult(false);
        }
    }

    showFloatTextForResult(result, element) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        if (result.type === 'defense') {
            this.showFloatText(`+${result.value} 护盾`, 'shield', element);
        } else if (result.crit) {
            this.showFloatText(`${result.damage} 暴击!`, 'crit', element);
        } else {
            this.showFloatText(`-${result.damage}`, 'damage', element);
        }
    }

    showFloatText(text, type, element) {
        const float = document.createElement('div');
        float.className = `damage-float ${type}`;
        float.textContent = text;

        const rect = element.getBoundingClientRect();
        float.style.left = (rect.left + rect.width / 2 - 30) + 'px';
        float.style.top = rect.top + 'px';

        document.body.appendChild(float);
        setTimeout(() => float.remove(), 1000);
    }

    checkLogicChains(row, col) {
        // 检查行
        const rowResult = this.combat.checkRowComplete(this.userGrid, row);
        if (rowResult.complete) {
            const rowElement = document.querySelector(`[data-row="${row}"][data-col="0"]`);
            this.showFloatText(`行连锁! -${rowResult.damage}`, 'combo', rowElement);
        }

        // 检查列
        const colResult = this.combat.checkColComplete(this.userGrid, col);
        if (colResult.complete) {
            const colElement = document.querySelector(`[data-row="0"][data-col="${col}"]`);
            this.showFloatText(`列连锁! -${colResult.damage}`, 'combo', colElement);
        }

        // 检查宫
        const boxRow = Math.floor(row / 2);
        const boxCol = Math.floor(col / 3);
        const boxResult = this.combat.checkBoxComplete(this.userGrid, boxRow, boxCol);
        if (boxResult.complete) {
            const boxElement = document.querySelector(`[data-row="${boxRow * 2}"][data-col="${boxCol * 3}"]`);
            this.showFloatText(`宫爆发! -${boxResult.damage} 冰冻!`, 'combo', boxElement);
        }
    }

    isValidMove(row, col, num) {
        // 检查行
        for (let j = 0; j < this.size; j++) {
            if (j !== col && this.userGrid[row][j] === num) return false;
        }

        // 检查列
        for (let i = 0; i < this.size; i++) {
            if (i !== row && this.userGrid[i][col] === num) return false;
        }

        // 检查宫 (2x3)
        const boxRowStart = Math.floor(row / 2) * 2;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 3; j++) {
                const r = boxRowStart + i;
                const c = boxColStart + j;
                if ((r !== row || c !== col) && this.userGrid[r][c] === num) return false;
            }
        }

        return true;
    }

    deleteCell() {
        if (!this.selectedCell) return;
        const { row, col } = this.selectedCell;

        if (this.fixedCells.includes(`${row}-${col}`)) return;

        this.userGrid[row][col] = 0;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = '';
        cell.classList.remove('filled-defense', 'filled-arcane', 'filled-power');
    }

    undo() {
        if (this.history.length === 0) return;
        const lastMove = this.history.pop();
        this.userGrid[lastMove.row][lastMove.col] = lastMove.oldValue;
        this.render();
    }

    showResult(win) {
        const modal = document.getElementById('resultModal');
        const title = document.getElementById('resultTitle');
        const icon = document.getElementById('resultIcon');
        const message = document.getElementById('resultMessage');

        if (win) {
            title.textContent = '胜利！';
            icon.textContent = '🎉';
            icon.className = 'result win';
            message.textContent = `你击败了逻辑怪物！Combo: ${this.combat.combo}`;
        } else {
            title.textContent = '失败...';
            icon.textContent = '💀';
            icon.className = 'result lose';
            message.textContent = '你的生命值耗尽了...';
        }

        modal.classList.add('show');
    }

    restart() {
        document.getElementById('resultModal').classList.remove('show');

        // 重置战斗系统
        this.combat = new CombatSystem();
        this.relics = [RELICS[0]];
        this.selectedCell = null;
        this.history = [];

        // 重新生成谜题
        this.init();
    }
}

// 启动游戏
const game = new Game();