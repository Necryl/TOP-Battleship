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
          case "Battle" || "End":
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
        } else {
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
    const cells = Object.values(
      Data[boardName === "player" ? "Player" : "AI"].board.cells
    ).reduce((final, current) => {
      final.push(current.loc);
      return final;
    }, []);
    refreshCells(boardName, ...cells);
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

  function initialise() {
    generateBoard(elem.board.player, Data.Player.board);
    generateBoard(elem.board.computer, Data.AI.board);

    document.body.addEventListener("touchmove", (event) => {
      if (stage === "Setup" && selectedShip !== null) {
        touchHoldShip(event.touches[0]);
      }
    });
    document.body.addEventListener("touchend", () => {
      if (stage === "Setup" && selectedShip !== null) {
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
      cellElem.setAttribute("data-status", "mist");
    });
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
    });
    elem.btn.start.addEventListener("click", () => {
      Engine.Game.start();
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
  };
})();

const Engine = (() => {
  const AI = (() => {
    const data = Data.AI;
    function play() {}
    return { play };
  })();

  const Player = (() => {
    function play() {}
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
    function start() {
      const ready = Data.Player.board.ships.reduce((final, current) => {
        if (current.cells.length === 0) {
          final = false;
        }
        return final;
      }, true);
      if (stage === "Setup" && ready) {
        updateStage("Battle");
      }
    }
    function newGame() {
      console.log("new Gaming");
    }
    return { start, newGame };
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
