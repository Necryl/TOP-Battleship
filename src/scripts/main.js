/* eslint-disable no-unused-vars */
import mainStyles from "./../styles/main.css";
/* eslint-enable no-unused-vars */

const Data = (() => {
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
      locs.forEach((loc) => {
        loc.forEach((num) => {
          if (num < 0 || num > size - 1) {
            throw Error("at least one of the given cells is invalid");
          }
        });
        if (cells[loc].ship !== null) {
          throw Error("at least one of the given cells already host a ship");
        }
      });
      // checking that the cells are adjacent
      const xCoords = [];
      const yCoords = [];
      locs.forEach((loc) => {
        xCoords.push(loc[0]);
        yCoords.push(loc[1]);
      });
      const isSimilar = (nums) => {
        let result = true;
        for (let i = 1; i < nums.length; i++) {
          if (nums[i - 1] !== nums[i]) {
            result = false;
            break;
          }
        }
        return result;
      };
      if (!isSimilar(xCoords) && !isSimilar(yCoords)) {
        throw Error("the given cells are not adjacent");
      }

      // reseting any cells that currently host the ship
      if (ships[ship - 1].cells.length !== 0) {
        ships[ship - 1].cells.forEach((cell) => {
          cells[cell].ship = null;
        });
      }

      const shipCells = [];
      [...locs].forEach((loc) => {
        cells[loc].ship = ship;
        shipCells.push(loc);
      });
      ships[ship - 1].cells = shipCells;
    }

    function placeAtRandom() {}

    function receiveAttack(loc) {
      loc.forEach((num) => {
        if (num < 0 || num > size - 1) {
          throw Error("Given cell location is invalid");
        }
      });
      const cell = cells[loc];
      cell.shot = true;
      if (cell.ship !== null) {
        ships[cell.ship - 1].hit();
        return true;
      }
      return false;
    }
    function defeated() {
      return ships.reduce((final, current) => {
        if (current.isSunk() === false) {
          final = false;
        }
        return final;
      }, true);
    }
    return { place, placeAtRandom, receiveAttack, defeated, ships, cells };
  }

  return { Ship, Gameboard, Cell };
})();

module.exports = { ...Data };
