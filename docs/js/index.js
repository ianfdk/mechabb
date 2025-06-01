import { units } from './data/units.js';

const HITS_TO_KILL = 'htk';
const TIME_TO_KILL = 'ttk';

let config = {
  attack: {
    level: 1,
    increase: 0,
    decreases: [],
  },
  defense: {
    level: 1,
    increase: 0,
    decreases: [],
  },
  display: {
    displayAs: HITS_TO_KILL,
  },
}

function updateConfig(form) {
  const formData = new FormData(form);

  config.attack.level = parseInt(formData.get('attackLevel'));
  config.attack.increase = parseInt(formData.get('attackIncrease')) || 0;
  config.attack.decreases = (formData.get('attackDecreases') || "0").split(',').map(
    (n) => parseInt(n)
  );

  config.defense.level = parseInt(formData.get('defenseLevel'));
  config.defense.increase = parseInt(formData.get('defenseIncrease')) || 0;
  config.defense.decreases = (formData.get('defenseDecreases') || "0").split(',').map(
    (n) => parseInt(n)
  );

  config.display.displayAs = formData.get('displayAs');
}

function calculateTotalHp(defender) {
  // Apply level
  const baseHp = defender.hp * config.defense.level;
  // Apply decrease
  let decreasedHp = baseHp;
  for (const decrease of config.defense.decreases) {
    decreasedHp = decreasedHp * (1 - decrease / 100)
  }
  // Apply increase
  const increasedHp = decreasedHp * (1 + config.defense.increase / 100);
  return increasedHp;
}

function calculateTotalAttack(attacker) {
  // Apply level
  const baseAttack = attacker.maxAttack * config.attack.level;
  // Apply decrease
  let decreasedAttack = baseAttack;
  for (const decrease of config.attack.decreases) {
    decreasedAttack = decreasedAttack * (1 - decrease / 100)
  }
  // Apply increase
  const increasedAttack = decreasedAttack * (1 + config.attack.increase / 100);
  return Math.floor(increasedAttack);
}

function calculateDps(unit) {
  return Math.round(calculateTotalAttack(unit) * (1 / unit.attackInterval));
}

function calculateHitsToKill(attacker, defender) {
  if (!attacker.targetsAir && defender.air) return -1;
  if (attacker.maxAttack <= 0) return Infinity;
  const totalHp = calculateTotalHp(defender);
  const totalAttack = calculateTotalAttack(attacker);
  return totalHp / totalAttack;
}

function calculateTimeToKill(attacker, defender) {
  return Math.ceil(calculateHitsToKill(attacker, defender)) * attacker.attackInterval;
}

function getColorClass(hits) {
  if (hits <= 0) return 'cell-0';
  if (hits <= 1) return 'cell-1';
  if (hits <= 2) return 'cell-2';
  if (hits <= 5) return 'cell-3';
  if (hits <= 10) return 'cell-4';
  return 'cell-5';
}

function renderHeaderCell(unit) {
  return `
  <th class="unit-name">
    ${unit.name}<br/>${Math.floor(calculateTotalHp(unit))} HP
  </th>`;
}

function formatCellText(atkValue) {
  if (isNaN(atkValue)) return 'N/A';
  if (atkValue === Infinity) return '∞';
  if (atkValue === -1) return '';
  let atkValueFixed = atkValue.toFixed(2);
  if (config.display.displayAs === TIME_TO_KILL) atkValueFixed += 's'
  return atkValueFixed;
}

function renderBodyCell(rowUnit, colUnit) {
  const cellValue = config.display.displayAs === HITS_TO_KILL 
    ? calculateHitsToKill(rowUnit, colUnit)
    : calculateTimeToKill(rowUnit, colUnit)
  const colorClass = getColorClass(cellValue);
  const cellText = formatCellText(cellValue);
  return `
    <td class="hits ${colorClass}">
      ${ cellText }
    </td>`;
}

function renderBodyRow(rowUnit) {
  let atkValue = '';
  if (config.display.displayAs === HITS_TO_KILL) {
    atkValue = `${calculateTotalAttack(rowUnit)} DMG`;
  } else if (config.display.displayAs === TIME_TO_KILL) {
    if (rowUnit.attackInterval === null) {
      return '';
    }
    atkValue = `${calculateDps(rowUnit)} DPS`;
  }
  return `
    <tr>
      <td class="unit-name">${rowUnit.name} - ${atkValue}</td>
      ${ units.map(colUnit => renderBodyCell(rowUnit, colUnit)).join('') }
    </tr>`;
}

function renderMatchupTable() {
  const headerRow = document.getElementById('headerRow');
  const tableBody = document.getElementById('tableBody');
  
  headerRow.innerHTML =
    `<th></th>
    ${ units.map((unit) => renderHeaderCell(unit)).join('') }`;
  tableBody.innerHTML = units.map(unit => renderBodyRow(unit)).join('');
}

function initialize() {
  renderMatchupTable();

  const form = document.getElementById('levelForm');
  form.addEventListener('change', (e) => {
    if (!e.target.form.checkValidity()) { return }
    updateConfig(e.target.form);
    renderMatchupTable();
  });
}

initialize();
