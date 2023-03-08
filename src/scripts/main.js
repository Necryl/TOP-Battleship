/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import mainStyles from "./../styles/main.css";
import arenaViewStyles from "./../styles/arenaView.css";
import helpViewStyles from "./../styles/helpView.css";
import endViewStyles from "./../styles/endView.css";
import { Data } from "./data";
/* eslint-enable no-unused-vars */

let stage = null; // null || "Setup" || "Battle" || "End"

const UI = (() => {
  const elem = {
    root: document.querySelector(":root"),
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
    shipStatus: {
      player: [
        document.querySelector("#arena #player .status[data-size='1']"),
        document.querySelector("#arena #player .status[data-size='2']"),
        document.querySelector("#arena #player .status[data-size='3']"),
        document.querySelector("#arena #player .status[data-size='4']"),
      ],
      computer: [
        document.querySelector("#arena #computer .status[data-size='1']"),
        document.querySelector("#arena #computer .status[data-size='2']"),
        document.querySelector("#arena #computer .status[data-size='3']"),
        document.querySelector("#arena #computer .status[data-size='4']"),
      ],
    },
    name: {
      player: document.querySelector("#arena #player .name"),
      computer: document.querySelector("#arena #computer .name"),
    },
    topBar: document.querySelector("#arenaView #topBar"),
    endMsg: document.querySelector("#endView #endMsg"),
    getCell: (boardName, loc) =>
      // loc -> "x,y"
      elem.board[boardName].querySelector(`.cell[data-loc="${loc}"]`),
  };

  let selectedShip = null;
  let selectedShipOrientation = "horizontal";
  const heldCells = [];

  function generateBoard(boardElem, boardData) {
    Object.keys(boardData.cells).forEach((cell) => {
      const element = document.createElement("div");
      element.classList.add("cell");
      element.setAttribute("data-loc", cell);
      element.setAttribute("data-status", "");
      boardElem.appendChild(element);
    });
  }

  function holdShip(boardName, loc) {
    function checkLoc(coord) {
      if (coord === false) {
        return false;
      }
      coord = JSON.parse(`[${coord}]`);
      let result = true;
      coord.forEach((num) => {
        if (num > 9 || num < 0) {
          result = false;
        }
      });
      return result;
    }
    const directions =
      selectedShipOrientation === "horizontal"
        ? ["left", "right"]
        : ["up", "down"];
    let length = selectedShip - 1;

    for (let i = heldCells.length; i > 0; i--) {
      const cell = heldCells.pop();
      if (cell[0].getAttribute("data-status") === "hold") {
        cell[0].setAttribute("data-status", cell[1]);
      }
    }

    let currentCell = elem.getCell(boardName, loc);
    heldCells.push([currentCell, currentCell.getAttribute("data-status")]);
    currentCell.setAttribute("data-status", "hold");

    const tempLocs = [loc, loc];

    while (length > 0) {
      if (tempLocs[0] !== null) {
        tempLocs[0] = Data[
          boardName === "player" ? "Player" : "AI"
        ].board.getAdjacentCell(tempLocs[0], directions[0]);
      }
      if (checkLoc(tempLocs[0]) === false) {
        tempLocs[0] = null;
      }
      if (tempLocs[0] !== null) {
        currentCell = elem.getCell(boardName, tempLocs[0]);
        heldCells.unshift([
          currentCell,
          currentCell.getAttribute("data-status"),
        ]);
        currentCell.setAttribute("data-status", "hold");
        length -= 1;
      }
      if (length > 0) {
        if (tempLocs[1] !== null) {
          tempLocs[1] = Data[
            boardName === "player" ? "Player" : "AI"
          ].board.getAdjacentCell(tempLocs[1], directions[1]);
        }
        if (checkLoc(tempLocs[1]) === false) {
          tempLocs[1] = null;
        }
        if (tempLocs[1] !== null) {
          currentCell = elem.getCell(boardName, tempLocs[1]);
          heldCells.push([
            currentCell,
            currentCell.getAttribute("data-status"),
          ]);
          currentCell.setAttribute("data-status", "hold");
          length -= 1;
        }
      }
    }
  }

  function placeHeldCells() {
    const shipCellLocs = heldCells.reduce((final, current) => {
      final.push(JSON.parse(`[${current[0].getAttribute("data-loc")}]`));
      return final;
    }, []);
    const oldCells = Data.Player.board.ships[selectedShip - 1].cells.slice(0);
    const placed = Engine.Player.place(selectedShip, shipCellLocs);
    if (placed) {
      refreshCells("player", ...oldCells);
    }
  }

  function addCellEvents(cellElem) {
    cellElem.addEventListener("mouseover", () => {
      if (stage === "Setup" && selectedShip !== null) {
        holdShip(
          elem.board.player.contains(cellElem) ? "player" : "computer",
          cellElem.getAttribute("data-loc")
        );
      }
    });
    // eslint-disable-next-line consistent-return
    cellElem.addEventListener("contextmenu", (event) => {
      if (stage === "Setup" && selectedShip !== null) {
        event.preventDefault();
        selectedShipOrientation =
          selectedShipOrientation === "horizontal" ? "vertical" : "horizontal";
        holdShip(
          elem.board.player.contains(cellElem) ? "player" : "computer",
          cellElem.getAttribute("data-loc")
        );
        return false;
      }
    });
    cellElem.addEventListener("click", () => {
      if (stage === "Setup" && selectedShip !== null) {
        placeHeldCells();
      }
    });
  }

  function refreshCells(boardName, ...cellLocs) {
    cellLocs.forEach((loc) => {
      if (typeof loc === "string") {
        loc = JSON.parse(`[${loc}]`);
      }
      const boardData = Data[boardName === "player" ? "Player" : "AI"].board;
      const cell = boardData.cells[loc];
      let status;
      if (boardName === "player") {
        switch (stage) {
          case "Setup":
            status = "water";
            break;
          case "Battle":
            status = "mist";
            break;
          case "End":
            status = "mist";
            break;
          default:
            throw Error(`Unexpected stage value: ${stage}`);
        }
      } else {
        status = "mist";
      }
      if (cell.ship !== null) {
        if (boardData.ships[cell.ship - 1].isSunk()) {
          status = "sunk";
        } else if (cell.shot) {
          status = "hit";
        } else if (boardName === "player" || stage === "End") {
          status = "ship";
        }
      } else if (cell.shot) {
        status = "water";
      }
      elem
        .getCell(boardName, loc.join(","))
        .setAttribute("data-status", status);
    });
  }

  function refreshBoard(boardName) {
    const dataBoard = Data[boardName === "player" ? "Player" : "AI"].board;
    const cells = Object.values(dataBoard.cells).reduce((final, current) => {
      final.push(current.loc);
      return final;
    }, []);
    refreshCells(boardName, ...cells);
    dataBoard.ships.forEach((ship) => {
      if (ship.isSunk()) {
        elem.shipStatus[boardName][ship.length - 1].setAttribute(
          "data-status",
          "sunk"
        );
      } else {
        elem.shipStatus[boardName][ship.length - 1].setAttribute(
          "data-status",
          "intact"
        );
      }
    });
  }

  function updateStage() {
    elem.root.setAttribute("data-stage", stage);
    refreshBoard("player");
    refreshBoard("computer");
    if (stage === "Setup") {
      elem.shipStatus.player[3].dispatchEvent(new Event("click"));
    }
  }

  function selectShip(shipNum) {
    const index = shipNum - 1;
    const ship = elem.shipStatus.player[index];
    elem.shipStatus.player.forEach((status) => {
      if (status === ship) {
        if (status.classList.contains("selected") === false) {
          status.classList.add("selected");
          selectedShip = shipNum;
        } else {
          status.classList.remove("selected");
          selectedShip = null;
        }
      } else {
        status.classList.remove("selected");
      }
    });
  }
  function selectedShipNum() {
    return selectedShip;
  }

  let previousTouchedCell = null;
  function touchHoldShip(touchObject) {
    const cell = document.elementFromPoint(
      touchObject.clientX,
      touchObject.clientY
    );
    if (cell.classList.contains("cell") && previousTouchedCell !== cell) {
      holdShip(
        elem.board.player.contains(cell) ? "player" : "computer",
        cell.getAttribute("data-loc")
      );
      previousTouchedCell = cell;
    }
  }

  function updateTurn(playerName) {
    Object.entries(elem.name).forEach((entry) => {
      if (entry[0] === playerName) {
        entry[1].classList.add("playing");
      } else {
        entry[1].classList.remove("playing");
      }
    });
  }

  function declare(verdict) {
    const message = verdict ? "You win!" : "You lose!";
    elem.endMsg.textContent = message;
    elem.view.end.classList.remove("disappear");
  }

  function initialise() {
    generateBoard(elem.board.player, Data.Player.board);
    generateBoard(elem.board.computer, Data.AI.board);

    document.body.addEventListener("touchmove", (event) => {
      if (stage === "Setup" && selectedShip !== null) {
        touchHoldShip(event.touches[0]);
      }
    });
    document.body.addEventListener("touchend", () => {
      if (
        stage === "Setup" &&
        selectedShip !== null &&
        heldCells.length !== 0
      ) {
        placeHeldCells();
      }
    });
    elem.board.player.addEventListener("mouseleave", () => {
      if (heldCells.length > 0) {
        for (let i = heldCells.length; i > 0; i--) {
          const cell = heldCells.pop();
          if (cell[0].getAttribute("data-status") === "hold") {
            cell[0].setAttribute("data-status", cell[1]);
          }
        }
      }
    });
    elem.board.player.querySelectorAll(".cell").forEach((cellElem) => {
      addCellEvents(cellElem);
    });
    elem.board.computer.querySelectorAll(".cell").forEach((cellElem) => {
      cellElem.addEventListener("click", () => {
        if (stage === "Battle" && Engine.Game.getTurn() === "Player") {
          Engine.Player.play(cellElem);
        }
      });
    });
    elem.btn.help.addEventListener("click", () => {
      elem.view.help.classList.remove("disappear");
      elem.topBar.classList.remove("open");
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
    elem.shipStatus.player.forEach((ship, index) => {
      ship.addEventListener("click", () => {
        if (stage === "Setup") {
          selectShip(index + 1);
        }
      });
    });
    elem.btn.reset.addEventListener("click", () => {
      if (stage === "Setup") {
        Engine.Player.resetBoard();
      }
    });
    elem.btn.randomize.addEventListener("click", () => {
      if (stage === "Setup") {
        Engine.Player.randomize();
      }
    });
    elem.btn.newGame.addEventListener("click", () => {
      Engine.Game.newGame();
      elem.topBar.classList.remove("open");
    });
    elem.btn.start.addEventListener("click", () => {
      Engine.Game.start();
    });
    elem.topBar.addEventListener("mouseover", () => {
      elem.topBar.classList.add("open");
    });
  }

  return {
    elem,
    initialise,
    updateStage,
    selectShip,
    refreshCells,
    refreshBoard,
    selectedShipNum,
    updateTurn,
    declare,
  };
})();

const Engine = (() => {
  const AI = (() => {
    const data = Data.AI;
    function randomLoc() {
      return [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
    }
    function play() {
      // console.groupCollapsed("AI's time to shine");
      let loc;
      let dir;
      if (data.exposedShips.length === 0) {
        let invalid = true;
        while (invalid) {
          loc = randomLoc();
          if (data.look(loc) === false) {
            invalid = false;
          }
        }
      } else if (data.exposedShips[0].direction() === null) {
        const dirs = ["up", "down", "left", "right"];
        for (let i = 0; i < dirs.length; i++) {
          const adjacent = Data.Player.board.getAdjacentCell(
            data.exposedShips[0].cells[0],
            dirs[i]
          );
          if (adjacent !== false && data.look(adjacent) === false) {
            // console.log("look says:", data.look(adjacent));
            loc = adjacent;
            dir = dirs[i];
            break;
          }
        }
      } else {
        // console.log("found direction:", data.exposedShips[0].direction());
        const directions =
          data.exposedShips[0].direction() === "vertical"
            ? ["up", "down"]
            : ["left", "right"];
        const cellHead = data
          .currentBoard()
          .getAdjacentCell(data.exposedShips[0].cells[0], directions[0]);

        // console.log("cellHead:", cellHead);
        if (cellHead !== false && data.look(cellHead) === false) {
          loc = cellHead;
          // eslint-disable-next-line prefer-destructuring
          dir = directions[0];
          // console.log("going with cellHead");
        } else {
          // console.log("going with cellEnd");
          const cellEnd = data
            .currentBoard()
            .getAdjacentCell(
              data.exposedShips[0].cells[data.exposedShips[0].cells.length - 1],
              directions[1]
            );
          loc = cellEnd;
          // eslint-disable-next-line prefer-destructuring
          dir = directions[1];
        }
      }
      data.visibleCells.push(JSON.stringify(loc));
      // console.log("Gonna try:", loc);
      const hit = Data.Player.board.receiveAttack(loc);
      if (hit) {
        let newShip = true;
        const shipNum = Data.Player.board.cells[loc].ship;
        const sunk = Data.Player.board.ships[shipNum - 1].isSunk();
        if (data.exposedShips.length !== 0) {
          data.exposedShips.forEach((exposedShip, index) => {
            if (shipNum === exposedShip.ship) {
              newShip = false;
              if (sunk === false) {
                if (["up", "left"].includes(dir)) {
                  exposedShip.cells.unshift(loc);
                } else {
                  exposedShip.cells.push(loc);
                }
                if (exposedShip.direction() === null) {
                  exposedShip.direction(dir);
                }
              } else {
                data.exposedShips.splice(index, 1);
              }
            }
          });
        }
        if (newShip && sunk === false) {
          const newExposed = data.exposed(Data.Player.board.cells[loc].ship);
          data.exposedShips.push(newExposed);
          newExposed.cells.push(loc);
        }
      }
      setTimeout(() => {
        UI.refreshBoard("player");
        Engine.Game.updateTurn();
      }, 1500);
      // console.groupEnd("AI out");
    }
    function resetBoard() {
      Data.AI.reset();
      UI.refreshBoard("computer");
    }

    return { play, randomLoc, resetBoard };
  })();

  const Player = (() => {
    function play(cellElem) {
      const loc = JSON.parse(`[${cellElem.getAttribute("data-loc")}]`);
      if (Data.AI.board.cells[loc].shot === false) {
        Data.AI.board.receiveAttack(loc);
        UI.refreshBoard("computer");
        Game.updateTurn();
      }
    }
    function place(shipNum, shipCellLocs) {
      const empty = shipCellLocs.reduce((final, current) => {
        if (Data.Player.board.cells[current].ship !== null) {
          final = false;
        }
        return final;
      }, true);
      if (empty) {
        Data.Player.board.place(shipNum, ...shipCellLocs);
        UI.refreshCells("player", ...shipCellLocs);
        const nextShip = Data.Player.board.ships.reduce((final, current) => {
          if (current.cells.length === 0) {
            final = current.length;
          }
          return final;
        }, shipNum);
        UI.selectShip(nextShip);
        return true;
      }
      return false;
    }
    function resetBoard() {
      Data.Player.board.initiate();
      UI.refreshBoard("player");
      UI.selectShip(4);
    }
    function randomize() {
      Data.Player.board.placeAtRandom();
      UI.refreshBoard("player");
      if (UI.selectedShipNum !== null) {
        UI.selectShip(UI.selectedShipNum());
      }
    }

    return { play, place, resetBoard, randomize };
  })();

  const Game = (() => {
    let turn = null;
    function start() {
      const ready = Data.Player.board.ships.reduce((final, current) => {
        if (current.cells.length === 0) {
          final = false;
        }
        return final;
      }, true);
      if (stage === "Setup" && ready) {
        Data.AI.board.placeAtRandom();
        updateStage("Battle");
        turn = "Player";
        UI.updateTurn("player");
      }
    }

    function updateTurn() {
      turn = turn === "Player" ? "AI" : "Player";
      if (Data[turn].board.defeated()) {
        endGame();
      } else {
        UI.updateTurn(turn === "Player" ? "player" : "computer");
        if (turn === "AI") {
          AI.play();
        }
      }
    }

    function endGame() {
      let won;
      if (Data.AI.board.defeated()) {
        won = true;
      } else if (Data.Player.board.defeated()) {
        won = false;
      } else {
        throw Error("Neither board is defeated but endGame was called");
      }
      updateStage("End");
      UI.declare(won);
    }

    function getTurn() {
      return turn;
    }

    function reset() {
      turn = null;
    }

    function newGame() {
      AI.resetBoard();
      Player.resetBoard();
      reset();
      updateStage("Setup");
    }
    return { start, newGame, updateTurn, getTurn, reset };
  })();

  function updateStage(value) {
    stage = value;
    UI.updateStage();
  }

  function initialise() {
    UI.initialise();
    updateStage("Setup");
  }

  return {
    AI,
    Player,
    Game,
    initialise,
  };
})();

Engine.initialise();
