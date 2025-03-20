# knightRetreatUtils Module

File: `utils/knightRetreatUtils.ts`

## JSDoc Documentation

### Import: Position, RetreatOption (ImportDeclaration)

Knight Retreat UtilitiesUtilities for working with the pre-computed knight retreat table.

```typescript
/**
 * Knight Retreat Utilities
 * 
 * Utilities for working with the pre-computed knight retreat table.
 */
```

### generateRetreatKey (FunctionDeclaration)

Generates a key for the knight retreat table lookup

**Tags:**

- @param originalPosition The knight's original position
 * @param failedCapturePosition The position where the knight's attempted capture failed
 * @returns A numeric key for lookup in the retreat table

```typescript
/**
 * Generates a key for the knight retreat table lookup
 * @param originalPosition The knight's original position
 * @param failedCapturePosition The position where the knight's attempted capture failed
 * @returns A numeric key for lookup in the retreat table
 */
```

### unpackRetreatOption (FunctionDeclaration)

Unpacks a retreat option from its packed number representation

**Tags:**

- @param packedOption The numeric representation of a retreat option
 * @returns The unpacked RetreatOption object

```typescript
/**
 * Unpacks a retreat option from its packed number representation
 * @param packedOption The numeric representation of a retreat option
 * @returns The unpacked RetreatOption object
 */
```

### initializeKnightRetreatTable (FunctionDeclaration)

Decompresses and initializes the knight retreat table

```typescript
/**
 * Decompresses and initializes the knight retreat table
 */
```

### getKnightRetreatOptions (FunctionDeclaration)

Gets knight retreat options from the lookup table

**Tags:**

- @param originalPosition The knight's original position
 * @param failedCapturePosition The position where the knight's attempted capture failed
 * @returns Array of valid retreat options with their BP costs

```typescript
/**
 * Gets knight retreat options from the lookup table
 * @param originalPosition The knight's original position
 * @param failedCapturePosition The position where the knight's attempted capture failed
 * @returns Array of valid retreat options with their BP costs
 */
```

### isValidKnightRetreatPosition (FunctionDeclaration)

Checks if a position is a valid knight retreat position

```typescript
/**
 * Checks if a position is a valid knight retreat position
 */
```

### getKnightRetreatCost (FunctionDeclaration)

Gets the BP cost for a knight retreat

```typescript
/**
 * Gets the BP cost for a knight retreat
 */
```

## Module Documentation

```json
{
  name: "KnightRetreatUtils",
  purpose: "Runtime utilities for accessing and using the pre-computed knight retreat lookup table",
  publicAPI: {
    initializeKnightRetreatTable: "Decompresses and initializes the lookup table",
    getKnightRetreatOptions: "Gets all valid retreat options for a knight",
    isValidKnightRetreatPosition: "Checks if a position is a valid knight retreat position",
    getKnightRetreatCost: "Gets the BP cost for a knight retreat",
    generateRetreatKey: "Creates a numeric key for knight retreat table lookup",
    unpackRetreatOption: "Unpacks a retreat option from its compressed form"
  },
  dependencies: [
    "types",
    "constants/knightRetreatData",
    "pako"
  ],
  implementationStatus: "Complete",
  optimizations: [
    "Lazy decompression for optimal performance",
    "Platform-specific decompression (pako for browser, zlib for Node.js)",
    "Compact numeric keys and values for space efficiency"
  ]
}
```

