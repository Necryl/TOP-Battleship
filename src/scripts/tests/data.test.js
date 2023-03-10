/**
 * @jest-environment jsdom
 */

import { Data } from "../data";

describe("Ship factory", (Ship = Data.Ship) => {
  const ship4 = Ship(4);
  test("ship factory returns an object", () => {
    expect(typeof ship4).toBe("object");
  });
  test("ship4 length", () => {
    expect(ship4.length).toBe(4);
  });
  test("ship4 cells property", () => {
    expect(Array.isArray(ship4.cells)).toBe(true);
  });
  test("ship4.hit() and isSunk()", () => {
    for (let i = 0; i < 4; i++) {
      expect(ship4.isSunk()).toBe(false);
      ship4.hit();
    }
    expect(ship4.isSunk()).toBe(true);
  });
  test("ship4, 1 extra hit (after 4 hits)", () => {
    expect(ship4.hit).toThrow();
  });
  const ship3 = Ship(3);
  test("ship3 length", () => {
    expect(ship3.length).toBe(3);
  });
  test("testing invalid length values for ship", () => {
    [0, -1, -2].forEach((num) => {
      expect(() => {
        Ship(num);
      }).toThrow();
    });
    [5, 6, 7].forEach((num) => {
      expect(() => {
        Ship(num);
      }).toThrow();
    });
  });
});

describe("Cell factory", (Cell = Data.Cell) => {
  const cell00 = Cell([0, 0]);
  test("cell properties", () => {
    expect(cell00.ship).toBeDefined();
    expect(cell00.ship).toBe(null);
    expect(cell00.shot).toBeDefined();
    expect(cell00.shot).toBe(false);
    expect(cell00.loc).toBeDefined();
    expect(cell00.loc).toStrictEqual([0, 0]);
  });
});

describe("Gameboard factory", (Gameboard = Data.Gameboard) => {
  const board = Gameboard();
  test("gameboard returns an object", () => {
    expect(typeof board).toBe("object");
  });
  test("Gameboard should have these methods", () => {
    expect(board.place).toBeDefined();
    expect(board.placeAtRandom).toBeDefined();
    expect(board.receiveAttack).toBeDefined();
    expect(board.defeated).toBeDefined();
    expect(Array.isArray(board.ships)).toBe(true);
    expect(typeof board.cells).toBe("object");
  });
  test("test all 10x10 cells", () => {
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        expect(board.cells[[x, y]]).toBeDefined();
      }
    }
  });
  test("ships property contains the ships", () => {
    expect(board.ships.length).not.toBe(0);
    board.ships.forEach((ship) => {
      expect(ship.isSunk).toBeDefined();
    });
  });
  test("place method", () => {
    board.place(1, [0, 0]);
    expect(board.cells[[0, 0]].ship).not.toBe(null);
    expect(board.cells[[0, 0]].ship).toBe(1);
    expect(board.ships[0].cells).toStrictEqual([[0, 0]]);
    expect(() => board.place(1, [1, 0], [1, 1], [1, 2])).toThrow(); // number of cells is too big for the ship size
    expect(() => board.place(3, [5, 0], [5, 1], [5, 2])).not.toThrow(); // number of cells is fits the ship size
    board.place(1, [1, 0]);
    expect(board.cells[[0, 0]].ship).toBe(null);
    expect(board.cells[[1, 0]].ship).toBe(1);
    expect(board.ships[0].cells).toStrictEqual([[1, 0]]);
    expect(() => {
      board.place(2, [1, 0], [1, 1]);
    }).toThrow("at least one of the given cells already host a ship");
    expect(() => {
      board.place(2, [1, -1], [1, 1]);
    }).toThrow("at least one of the given cells is invalid");
    expect(() => {
      board.place(2, [9, 1], [10, 1]);
    }).toThrow("at least one of the given cells is invalid");
    expect(() => {
      board.place(2, [9, 0], [7, 1]);
    }).toThrow("the given cells are not adjacent");
  });
  test("placeAtRandom method", () => {
    const board1 = Gameboard();
    board1.place(1, [0, 1]);
    for (let i = 0; i < 1; i++) {
      expect(() => {
        board1.placeAtRandom();
      }).not.toThrow();
      board1.ships.forEach((ship) => {
        expect(ship.cells.length).toBe(ship.length);
      });
    }
  });
  test("receiveAttack method", () => {
    board.place(1, [0, 0]);
    board.place(2, [1, 0], [1, 1]);
    board.place(3, [2, 0], [2, 1], [2, 2]);
    board.place(4, [3, 0], [3, 1], [3, 2], [3, 3]);

    expect(board.cells[[0, 0]].shot).toBe(false);
    let response = board.receiveAttack([0, 0]);
    expect(response).toBe(true);
    expect(board.ships[0].isSunk()).toBe(true);
    expect(board.cells[[0, 0]].shot).toBe(true);
    response = board.receiveAttack([4, 0]);
    expect(response).toBe(false);
    expect(board.cells[[4, 0]].shot).toBe(true);
    expect(() => {
      board.receiveAttack([-1, 0]);
    }).toThrow("Given cell location is invalid");
    expect(() => {
      board.receiveAttack([0, 10]);
    }).toThrow("Given cell location is invalid");
    expect(() => {
      board.receiveAttack([0, 9]);
    }).not.toThrow();
  });
  test("defeated method", () => {
    const newBoard = Gameboard();
    newBoard.place(1, [1, 0]);
    newBoard.place(2, [2, 0], [2, 1]);
    newBoard.place(3, [3, 0], [3, 1], [3, 2]);
    newBoard.place(4, [4, 0], [4, 1], [4, 2], [4, 3]);

    expect(newBoard.defeated()).toBe(false);

    // sinking all the ships except the first one
    const shipsExceptOne = newBoard.ships.slice(1);
    shipsExceptOne.forEach((ship) => {
      ship.cells.forEach((loc) => {
        newBoard.receiveAttack(loc);
      });
      expect(ship.isSunk()).toBe(true);
    });

    expect(newBoard.defeated()).toBe(false);

    // sinking the last ship
    newBoard.receiveAttack([1, 0]);
    expect(newBoard.ships[0].isSunk()).toBe(true);

    expect(newBoard.defeated()).toBe(true);
  });
});

describe("Data -> AI", (AI = Data.AI) => {
  test("affirm existence of methods and properties", () => {
    expect(AI.exposed).toBeDefined();
    expect(AI.visibleCells).toBeDefined();
    expect(AI.currentBoard).toBeDefined();
    expect(AI.look).toBeDefined();
  });
});
