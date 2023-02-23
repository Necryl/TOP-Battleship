/* eslint-disable no-unused-vars */
import mainStyles from "./../styles/main.css";
/* eslint-enable no-unused-vars */

function Ship(length) {
  if (!(length < 5 && length > 0)) {
    throw Error(`invalid length param: out of range (1-4) -> ${length}`);
  }

  let hitCount = 0;
  const cells = [];

  function hit() {
    if (hitCount < length) {
      hitCount += 1;
    } else {
      throw Error("Ship is already destroyed");
    }
  }

  function isSunk() {
    return length === hitCount;
  }

  return {
    length,
    hit,
    isSunk,
    cells,
  };
}

function Cell(loc) {
  return {
    loc,
    ship: null,
    shot: false,
  };
}

function Gameboard(size = 10) {
  const ships = [];
  const cells = {};
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      cells[[x, y]] = Cell([x, y]);
    }
  }
  for (let i = 1; i <= 4; i++) {
    ships.push(Ship(i));
  }
  function place(ship, ...locs) {
    if (locs.length !== ship) {
      throw Error("number of cells to be filled doesn't match ship size");
    }
    const shipCells = [];
    [...locs].forEach((loc) => {
      cells[loc].ship = ship;
      shipCells.push(loc);
    });
    ships[ship - 1].cells = shipCells;
  }
  function receiveAttack() {}
  function defeated() {}
  return { place, receiveAttack, defeated, ships, cells };
}

module.exports = { Ship, Gameboard, Cell };
