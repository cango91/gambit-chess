import { BOARD_SIZE } from "@/constants";
import { ValueObject } from "@/types";
import { IChessPiece } from "./contracts";

// Define chess position coordinates type
export interface ChessCoordinates {
    x: number;
    y: number;
}



/**
 * Represents a chess position
 * 
 * Can be initialized with a string (e.g. "e4") or an array of coordinates (e.g. [4, 3])
 * Can be used anywhere a string is expected
 */
export class ChessPosition implements ValueObject<string> {
    private _value: string;

    constructor(value: string | number[] | ChessCoordinates | ChessPosition);
    constructor(file: string, rank: number);
    constructor(fileOrValue: string | number[] | ChessCoordinates | ChessPosition | number, rank?: number) {
        if (typeof fileOrValue === 'string' && rank !== undefined) {
            // Handle constructor with file and rank as separate arguments
            const file = fileOrValue.toLowerCase();
            if (file < 'a' || file > 'h' || rank < 1 || rank > 8) {
                throw new Error('Invalid position');
            }
            this._value = `${file}${rank}`;
        } else if (typeof fileOrValue === 'string') {
            // Handle constructor with string position
            this._value = ChessPosition.validate_position(fileOrValue.toLowerCase());
        } else if (Array.isArray(fileOrValue) && fileOrValue.length === 2) {
            // Handle constructor with coordinates array
            this._value = ChessPosition.fromCoordinates(fileOrValue[0], fileOrValue[1]).value;
        } else if (fileOrValue instanceof ChessPosition) {
            // Handle constructor with ChessPosition
            this._value = fileOrValue.value;
        } else if (fileOrValue && typeof fileOrValue === 'object' && 'x' in fileOrValue && 'y' in fileOrValue) {
            // Handle constructor with coordinates object
            this._value = ChessPosition.fromCoordinates(fileOrValue.x, fileOrValue.y).value;
        } else if (typeof fileOrValue === 'number' && rank !== undefined) {
            // Handle constructor with number and rank
            this._value = ChessPosition.fromCoordinates(fileOrValue, rank).value;
        } else {
            throw new Error('Invalid position');
        }
    }

    // Validate a position string (e.g. "e4")
    static validate_position(value: string): string {
        if (value.length !== 2) {
            throw new Error('Invalid position format');
        }

        const file = value[0];
        const rank = value[1];

        if (file < 'a' || file > 'h' || rank < '1' || rank > '8') {
            throw new Error('Invalid position values');
        }

        return value;
    }

    // Get string value of the position
    get value(): string {
        return this._value;
    }

    // Validate coordinates array
    static validate_coordinates(value: number[]): number[] {
        if (value.length !== 2) {
            throw new Error('Invalid coordinates length');
        }

        if (value[0] < 0 || value[0] >= BOARD_SIZE || value[1] < 0 || value[1] >= BOARD_SIZE) {
            throw new Error('Invalid coordinates values');
        }

        return value;
    }

    // Enable automatic type conversion to string
    toString(): string {
        return this._value;
    }

    valueOf(): number {
        return this.toCoordinates()[0] * 10 + this.toCoordinates()[1];
    }

    // Make it possible to use in template literals
    [Symbol.toPrimitive](hint: string | number): string | number {
        if (hint === 'number') {
            return this.valueOf();
        }
        return this._value;
    }

    // Make equal comparison work
    equals(vo: ChessPosition | ValueObject<string>): boolean {
        if (vo instanceof ChessPosition) {
            return this._value === vo._value;
        }
        return this._value === vo.value;
    }

    hashCode(): string {
        return this._value;
    }

    /**
     * Converts the position to an array of coordinates
     * @returns The coordinates of the position
     */
    toCoordinates(): number[] {
        const file = this.value[0].toLowerCase();
        const rank = parseInt(this.value[1], 10);

        // Convert file (a-h) to x coordinate (0-7)
        const x = file.charCodeAt(0) - 'a'.charCodeAt(0);

        // Convert rank (1-8) to y coordinate (0-7), with 1 at the bottom
        const y = rank - 1;

        return [x, y];
    }
    isSameRank(other: ChessPosition | string | number[] | ChessCoordinates): boolean {
        const otherPos = other instanceof ChessPosition ? other : new ChessPosition(other);
        return this.toCoordinates()[1] === otherPos.toCoordinates()[1];
    }

    isSameFile(other: ChessPosition | string | number[] | ChessCoordinates): boolean {
        const otherPos = other instanceof ChessPosition ? other : new ChessPosition(other);
        return this.toCoordinates()[0] === otherPos.toCoordinates()[0];
    }

    isSameDiagonal(other: ChessPosition | string | number[] | ChessCoordinates): boolean {
        const otherPos = other instanceof ChessPosition ? other : new ChessPosition(other);
        const [x1, y1] = this.toCoordinates();
        const [x2, y2] = otherPos.toCoordinates();
        return Math.abs(x1 - x2) === Math.abs(y1 - y2);
    }

    getPositionsBetween(other: ChessPosition | string | number[] | ChessCoordinates): ChessPosition[] {
        const otherPos = other instanceof ChessPosition ? other : new ChessPosition(other);
        const positions: ChessPosition[] = [];

        if (!this.isSameRank(otherPos) && !this.isSameFile(otherPos) && !this.isSameDiagonal(otherPos)) {
            return positions;
        }

        const [x1, y1] = this.toCoordinates();
        const [x2, y2] = otherPos.toCoordinates();

        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);

        let currentX = x1 + dx;
        let currentY = y1 + dy;

        // Add all positions between from and to
        while (currentX !== x2 || currentY !== y2) {
            positions.push(ChessPosition.fromCoordinates(currentX, currentY));
            currentX += dx;
            currentY += dy;
        }

        return positions;
    }

    /**
     * Creates a new ChessPosition from a string
     * @param value - The string to create the position from
     * @returns A new ChessPosition instance
     */
    static fromString(value: string): ChessPosition {
        return new ChessPosition(value);
    }

    /**
     * Creates a new ChessPosition from two coordinates (0-7, 0-7)
     * @param x - The x coordinate
     * @param y - The y coordinate
     * @returns A new ChessPosition instance
     */
    static fromCoordinates(x: number, y: number): ChessPosition {
        const coordinates = ChessPosition.validate_coordinates([x, y]);

        // Convert x coordinate (0-7) to file (a-h)
        const file = String.fromCharCode('a'.charCodeAt(0) + coordinates[0]);

        // Convert y coordinate (0-7) to rank (1-8)
        const rank = coordinates[1] + 1;

        return new ChessPosition(`${file}${rank}`);
    }

    /**
     * Checks if a value is a valid ChessPosition
     * @param value - The value to check
     * @returns True if the value is a valid ChessPosition, false otherwise
     */
    static isValidPosition<T>(value: T): boolean {
        try {
            ChessPosition.from(value);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Generic factory method that creates a ChessPosition from various input types
     */
    static from<T>(value: T): ChessPosition {
        if (!value) {
            throw new Error('Invalid position');
        }
        if (value instanceof ChessPosition) {
            return value;
        }
        if (typeof value === 'string') {
            return new ChessPosition(value);
        }
        if (Array.isArray(value) && value.length === 2) {
            return ChessPosition.fromCoordinates(value[0], value[1]);
        }
        if (typeof value === 'number' && value.toString().length === 2) {
            return ChessPosition.fromCoordinates(Math.floor(value / 10), value % 10);
        }
        if (typeof value === 'object' && value !== null && 'x' in value && 'y' in value &&
            typeof (value as any).x === 'number' && typeof (value as any).y === 'number') {
            return ChessPosition.fromCoordinates((value as any).x, (value as any).y);
        }
        throw new Error('Invalid position');
    }
}

export type ChessPositionType = string | number[] | ChessCoordinates | ChessPosition;

/**
 * Represents a chess piece color
 * 
 * Can be initialized with a string (e.g. "w" or "b")
 * Can be used anywhere a string is expected
 */
export class ChessPieceColor implements ValueObject<string> {
    static readonly colors = {
        w: 'white',
        b: 'black'
    }
    private _value: 'w' | 'b' = 'w';

    constructor(value: string | ChessPieceColor) {
        if (value instanceof ChessPieceColor)
            this.value = value.value;
        else
            this.value = value;
    }

    get value(): string {
        return this._value;
    }

    set value(value: string) {
        if (!value) throw new Error('Invalid color');
        value = value.toLowerCase();
        if (value[0] !== 'w' && value[0] !== 'b') throw new Error('Invalid color');
        this._value = value[0] as 'w' | 'b';
    }

    equals(vo: ChessPieceColor | ValueObject<string>): boolean {
        if (vo instanceof ChessPieceColor) {
            return this._value === vo._value;
        }
        return this.equals(ChessPieceColor.from(vo.value));
    }

    hashCode(): string {
        return this._value;
    }

    toString(): string {
        return ChessPieceColor.colors[this._value];
    }

    valueOf(): number {
        return this._value === 'w' ? 1 : -1;
    }

    static from(value: string): ChessPieceColor {
        return new ChessPieceColor(value);
    }



    static fromValue(value: string): ChessPieceColor {
        return new ChessPieceColor(ChessPieceColor.colors[value as keyof typeof ChessPieceColor.colors]);
    }
}

export type ChessPieceColorType = string | ChessPieceColor;

export type ChessPieceTypeSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/**
 * Represents a chess piece type
 * 
 * Can be initialized with a string symbol (e.g. "p" for pawn)
 * Contains the classic chess value for each piece type
 */
export class ChessPieceType implements ValueObject<string> {
    static readonly types: Record<ChessPieceTypeSymbol, string> = {
        p: 'pawn',
        n: 'knight',
        b: 'bishop',
        r: 'rook',
        q: 'queen',
        k: 'king'
    };

    static readonly values: Record<ChessPieceTypeSymbol, number> = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
        k: 0 // King has no capture value
    };

    private _value: ChessPieceTypeSymbol = 'p';

    constructor(value: string | ChessPieceType) {
        if (value instanceof ChessPieceType)
            this.value = value.value;
        else
            this.value = value;
    }

    get value(): string {
        return this._value;
    }

    set value(value: string) {
        if (!value) throw new Error('Invalid piece type');
        value = value.toLowerCase();
        if (!(value[0] in ChessPieceType.types)) throw new Error('Invalid piece type');
        this._value = value[0] as ChessPieceTypeSymbol;
    }

    /**
     * Gets the classic chess value of the piece
     */
    get classicValue(): number {
        return ChessPieceType.values[this._value];
    }

    equals(vo: ChessPieceType | ValueObject<string>): boolean {
        if (vo instanceof ChessPieceType) {
            return this._value === vo._value;
        }
        return this.equals(ChessPieceType.from(vo.value));
    }

    hashCode(): string {
        return this._value;
    }

    toString(): string {
        return ChessPieceType.types[this._value];
    }

    valueOf(): number {
        return Object.keys(ChessPieceType.types).indexOf(this._value);
    }

    /**
     * Determines if the piece is a long-range piece (bishop, rook, queen)
     */
    isLongRange(): boolean {
        return ['b', 'r', 'q'].includes(this._value);
    }

    static from(value: string | ChessPieceType): ChessPieceType {
        return new ChessPieceType(value);
    }

    static fromValue(value: string): ChessPieceType {
        const symbol = Object.entries(ChessPieceType.types)
            .find(([_, name]) => name === value)?.[0] as ChessPieceTypeSymbol;

        if (!symbol) throw new Error(`Invalid piece type value: ${value}`);
        return new ChessPieceType(symbol);
    }
}

export type ChessPieceTypeType = string | ChessPieceType;

export class ChessPiece implements IChessPiece {
    private _type: ChessPieceType;
    private _color: ChessPieceColor;
    private _position: ChessPosition | null;
    private _hasMoved: boolean;
    private _lastMoveTurn: number | undefined;

    constructor(type: ChessPieceType, color: ChessPieceColor, position: ChessPosition | null, hasMoved: boolean = false, lastMoveTurn: number | undefined = undefined) {
        this._type = type;
        this._color = color;
        this._position = position;
        this._hasMoved = hasMoved;
        this._lastMoveTurn = lastMoveTurn;
    }

    get type(): ChessPieceType {
        return this._type;
    }

    get color(): ChessPieceColor {
        return this._color;
    }

    get position(): ChessPosition | null {
        return this._position;
    }

    get hasMoved(): boolean {
        return this._hasMoved;
    }

    get lastMoveTurn(): number | undefined {
        return this._lastMoveTurn;
    }

    set lastMoveTurn(lastMoveTurn: number | undefined) {
        this._lastMoveTurn = lastMoveTurn;
    }

    set position(position: ChessPositionType | null) {
        this._position = position ? ChessPosition.from(position) : null;
    }

    set hasMoved(hasMoved: boolean) {
        this._hasMoved = hasMoved;
    }

    move(position: ChessPositionType, turn: number | undefined = undefined) {
        this._position = position ? ChessPosition.from(position) : null;
        this._hasMoved = true;
        this._lastMoveTurn = turn ?? this._lastMoveTurn;
    }

    private _canPromote(): boolean {
        if (!this.position) return false;
        return this.type.equals(ChessPieceType.from('p'))
            && (
                (this.color.equals(ChessPieceColor.from('w')) && this.position.isSameRank(ChessPosition.from('h8')))
                || (this.color.equals(ChessPieceColor.from('b')) && this.position.isSameRank(ChessPosition.from('h1')))
            )
    }

    promote(type: ChessPieceType) {
        if (['q', 'r', 'b', 'n'].includes(type.value) && this._canPromote()) {
            this._type = type;
        }
    }

    static fromString(value: string): ChessPiece | undefined {
        if (!value) return undefined;
        try {
            if (value.includes(' ')) {
                const parts = value.split(' ');
                if (parts.length === 3) {
                    return new ChessPiece(ChessPieceType.from(parts[0]), ChessPieceColor.from(parts[1]), ChessPosition.from(parts[2]), false, undefined);
                } else if (parts.length === 4) {
                    return new ChessPiece(ChessPieceType.from(parts[0]), ChessPieceColor.from(parts[1]), ChessPosition.from(parts[2]), true, parseInt(parts[3]));
                }
            } else if (value.includes('@')) {
                const parts = value.split('@');
                if (parts.length === 2 && parts[0].length === 2 && parts[1].length === 2) {
                    return new ChessPiece(ChessPieceType.from(parts[0][0]), ChessPieceColor.from(parts[0][1]), ChessPosition.from(parts[1]), false, undefined);
                } else if (parts.length === 2 && parts[0].length === 2 && parts[1].includes(',')) {
                    const [type, color] = parts[0].split('');
                    const [_, turn] = parts[1].split(',');
                    return new ChessPiece(ChessPieceType.from(type), ChessPieceColor.from(color), ChessPosition.from(parts[1]), true, parseInt(turn));
                }
            }
            return new ChessPiece(ChessPieceType.from(value), ChessPieceColor.from(value), null, false, undefined);
        } catch (e) {
            return undefined;
        }
    }

    // Overloaded declarations
    static from(value: ChessPiece): ChessPiece;
    static from(value: string): ChessPiece | undefined;
    static from(value: any): ChessPiece | undefined;

    static from(type: ChessPieceTypeType, color: ChessPieceColorType): ChessPiece | undefined;
    static from(type: ChessPieceTypeType, color: ChessPieceColorType, position: ChessPositionType): ChessPiece | undefined;
    static from(type: ChessPieceTypeType, color: ChessPieceColorType, position: ChessPositionType, lastMoveTurn: number): ChessPiece | undefined;
    // Implementation
    static from(...args: any[]): ChessPiece | undefined {
        try {
            if (args.length === 1) {
                const value = args[0];
                if (value instanceof ChessPiece)
                    return new ChessPiece(value.type, value.color, value.position, value.hasMoved, value.lastMoveTurn);
                if (typeof value === 'string')
                    return ChessPiece.fromString(value);
            } else if (args.length === 2) {
                const [type, color] = args;
                return new ChessPiece(ChessPieceType.from(type), ChessPieceColor.from(color), null, false, undefined);
            } else if (args.length === 3) {
                const [type, color, position] = args;
                return new ChessPiece(
                    ChessPieceType.from(type),
                    ChessPieceColor.from(color),
                    ChessPosition.from(position),
                    false,
                    undefined
                );
            } else if (args.length >= 4) {
                const [type, color, position, lastMoveTurn] = args;
                return new ChessPiece(
                    ChessPieceType.from(type),
                    ChessPieceColor.from(color),
                    ChessPosition.from(position),
                    true,
                    lastMoveTurn
                );
            }
            return undefined;
        } catch (e) {
            return undefined;
        }
    }
}

export type ChessPiece_Type = ChessPiece | string | [ChessPieceTypeType, ChessPieceColorType] | [ChessPieceTypeType, ChessPieceColorType, ChessPositionType] | [ChessPieceTypeType, ChessPieceColorType, ChessPositionType, number];