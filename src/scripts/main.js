/* eslint-disable no-unused-vars */
import mainStyles from "./../styles/main.css";
/* eslint-enable no-unused-vars */

function Ship(length) {
  if (!(length < 5 && length > 0)) {
    throw Error(`invalid length param: out of range (1-4) -> ${length}`);
  }

  let hitCount = 0;

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
  function place() {}
  function receiveAttack() {}
  function defeated() {}
  return { place, receiveAttack, defeated, ships, cells };
}

module.exports = { Ship, Gameboard, Cell };
