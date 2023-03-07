/* eslint-disable no-unused-vars */
import mainStyles from "./../styles/main.css";
import arenaViewStyles from "./../styles/arenaView.css";
import helpViewStyles from "./../styles/helpView.css";
import endViewStyles from "./../styles/endView.css";
/* eslint-enable no-unused-vars */

let stage = null;

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

    function initiate() {
      ships.splice(0, Infinity);
      Object.keys(cells).forEach((cell) => {
        delete cells[cell];
      });
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          cells[[x, y]] = Cell([x, y]);
        }
      }
      for (let i = 1; i <= 4; i++) {
        ships.push(Ship(i));
      }
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
    function getAdjacentCell(cell, dir) {
      switch (dir) {
        case "up":
          return [cell[0] + 1, cell[1]];
        case "down":
          return [cell[0] - 1, cell[1]];
        case "right":
          return [cell[0], cell[1] + 1];
        case "left":
          return [cell[0], cell[1] - 1];
        default:
          throw Error(`Invalid value for parameter dir (direction): ${dir}`);
      }
    }
    function placeAtRandom() {
      initiate();
      const cellLocs = Object.keys(cells);
      const randomCellLoc = () => {
        let cell;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const randomIndex = Math.floor(Math.random() * cellLocs.length);
          cell = JSON.parse(`[${cellLocs[randomIndex]}]`);
          if (cells[cell].ship === null) {
            break;
          } else {
            cellLocs.splice(randomIndex, 1);
          }
        }
        return cell;
      };
      const findCells = (shipNum) => {
        let shipCells = [randomCellLoc()];
        let dirs = ["up", "down", "right", "left"];
        let dir = Math.floor(Math.random() * dirs.length);
        while (shipCells.length !== shipNum) {
          const newCell = getAdjacentCell(
            shipCells[shipCells.length - 1],
            dirs[dir]
          );
          if (
            typeof cells[newCell] !== "undefined" &&
            cells[newCell].ship === null
          ) {
            shipCells.push(newCell);
          } else {
            shipCells = shipCells.slice(0, 1);
            dirs.splice(dir, 1);
            if (dirs.length === 0) {
              dirs = ["up", "down", "right", "left"];
              shipCells = [randomCellLoc()];
            }
            dir = Math.floor(Math.random() * dirs.length);
          }
        }
        return shipCells;
      };
      ships.forEach((ship) => {
        place(ship.length, ...findCells(ship.length));
      });
    }
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
        return true; // hit a ship!
      }
      return false; // missed!
    }
    function defeated() {
      return ships.reduce((final, current) => {
        if (current.isSunk() === false) {
          final = false;
        }
        return final;
      }, true);
    }

    initiate();

    return {
      initiate,
      place,
      placeAtRandom,
      receiveAttack,
      getAdjacentCell,
      defeated,
      ships,
      cells,
    };
  }

  const AI = (() => {
    const realBoard = [];
    const unexploredCells = [];
    const visibleCells = [];
    const board = Gameboard(10);
    function currentBoard() {}
    function look(cell) {
      if (visibleCells.includes(JSON.stringify(cell))) {
        return currentBoard()[cell];
      }
      return false;
    }

    const exposed = (() => {
      const cells = []; // has to be sorted (up to down) or (left to right)
      const dir = [null];
      function direction() {
        return dir[0];
      }
      function isSunk() {
        if (direction() === null) {
          return false;
        }
        const directions =
          direction() === "vertical" ? ["up", "down"] : ["left", "right"];
        const cellHead = look(
          currentBoard().getAdjacentCell(cells[0]),
          directions[0]
        );
        const cellEnd = look(
          currentBoard().getAdjacentCell(cells[cells.length - 1], directions[1])
        );
        if (cellHead === false || cellEnd === false) {
          return false;
        }
        return true;
      }
      function initiate(exposedCells = []) {
        cells.splice(0, Infinity);
        exposedCells.forEach((cell) => {
          cells.push(cell);
        });

        dir[0] = null;
      }
      return {
        cells,
        direction,
        isSunk,
        initiate,
      };
    })();
    return {
      board,
      currentBoard,
      look,
      exposed,
      unexploredCells,
      visibleCells,
    };
  })();

  const Player = (() => {
    const visibleCells = [];
    const board = Gameboard(10);

    return { visibleCells, board };
  })();

  return { Ship, Gameboard, Cell, AI, Player };
})();

const UI = (() => {
  const elem = {
    board: {
      player: document.querySelector("#arenaView #player .board"),
      computer: document.querySelector("#arenaView #computer .board"),
    },
    btn: {
      help: document.querySelector("#helpBtn"),
      newGame: document.querySelector("#newGameBtn"),
      randomize: document.querySelector("#randomizeBtn"),
      reset: document.querySelector("#resetBtn"),
      start: document.querySelector("#startBtn"),
    },
    view: {
      arena: document.querySelector("#arenaView"),
      help: document.querySelector("#helpView"),
      end: document.querySelector("#endView"),
    },
  };

  function generateBoard(boardElem, boardData) {
    Object.keys(boardData.cells).forEach((cell) => {
      const element = document.createElement("div");
      element.classList.add("cell");
      element.setAttribute("data-loc", cell);
      boardElem.appendChild(element);
    });
  }

  function initialise() {
    generateBoard(elem.board.player, Data.Player.board);
    generateBoard(elem.board.computer, Data.AI.board);

    elem.btn.help.addEventListener("click", () => {
      elem.view.help.classList.remove("disappear");
    });
    elem.view.help.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        elem.view.help.classList.add("disappear");
      }
    });
    elem.view.end.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        elem.view.end.classList.add("disappear");
      }
    });
  }

  return { elem, initialise };
})();

const Engine = (() => {
  const AI = (() => {
    const data = Data.AI;
    function play() {}
    return { play };
  })();

  const Player = (() => {
    function play() {}
    return { play };
  })();

  function initialise() {
    UI.initialise();
    stage = "Setup";
  }

  return {
    AI,
    Player,
    initialise,
  };
})();

Engine.initialise();

module.exports = { Data, UI, Engine };
