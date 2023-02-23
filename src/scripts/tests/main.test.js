import { Ship, Gameboard, Cell } from "../main";

describe("Ship factory", () => {
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

describe("Cell factory", () => {
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

describe("Gameboard factory", () => {
  const board = Gameboard();
  test("gameboard returns an object", () => {
    expect(typeof board).toBe("object");
  });
  test("Gameboard should have these methods", () => {
    expect(board.place).toBeDefined();
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
    expect(() => board.place(3, [0, 0], [0, 1], [0, 2])).not.toThrow(); // number of cells is fits the ship size
    board.place(1, [1, 0]);
    expect(board.ships[0].cells).toStrictEqual([[1, 0]]);
  });
});
