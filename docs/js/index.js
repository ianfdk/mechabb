import { units } from './data/units.js';

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
  return increasedAttack;
}

function calculateHits(attacker, defender) {
  if (!attacker.targetsAir && defender.air) return -1;
  if (attacker.maxAttack <= 0) return Infinity;
  const totalHp = calculateTotalHp(defender);
  const totalAttack = calculateTotalAttack(attacker);
  return totalHp / totalAttack;
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

function formatCellText(nbHits) {
  if (nbHits === Infinity) return '∞';
  if (nbHits === -1) return '';
  return nbHits.toFixed(2);
}

function renderBodyCell(rowUnit, colUnit) {
  const nbHits = calculateHits(rowUnit, colUnit);
  const colorClass = getColorClass(nbHits);
  const cellText = formatCellText(nbHits);
  return `
    <td class="hits ${colorClass}">
      ${ cellText }
    </td>`;
}

function renderBodyRow(rowUnit) {
  return `
    <tr>
      <td class="unit-name">${rowUnit.name} - ${Math.floor(calculateTotalAttack(rowUnit))} DMG</td>
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
