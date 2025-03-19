# Knight Retreat Table Generator

This repository contains utilities for working with a pre-computed lookup table for knight retreat costs. This optimization replaces complex runtime pathfinding calculations with a simple table lookup, reducing computational overhead particularly on mobile devices.

## How It Works

1. During the build process, the `generateKnightRetreatTable.js` script analyzes all possible knight positions, attack vectors, and retreat options on the chessboard.
2. For each retreat option, it calculates the minimum number of knight moves required to reach that position from the original position.
3. The script compresses this data using gzip and embeds it directly in the generated code.
4. The runtime code uses a lazy decompression approach to efficiently load the data when needed.

## Implementation Details

### Data Format

- **Keys**: Numeric keys (12-bit integers) encoding the start and attack positions:
  ```
  (startX << 9) | (startY << 6) | (attackX << 3) | attackY
  ```

- **Values**: Arrays of bit-packed integers encoding retreat positions and costs:
  ```
  (x & 0x7) | ((y & 0x7) << 3) | ((cost & 0x3) << 6)
  ```

### Build Process

The knight retreat table generation happens during the prebuild step:

1. The `scripts/generateKnightRetreatTable.js` script runs before TypeScript compilation
2. It generates a files:
   - `src/constants/knightRetreatData.ts` - Compressed table data
3. This file is included in the TypeScript compilation

### Compression

The entire table is:
1. Serialized to JSON
2. Compressed with gzip
3. Encoded as base64
4. Embedded as a string constant in the generated code

This multi-level compression achieves approximately 80-90% size reduction compared to the raw JSON.

## Usage

### Accessing the Table in Code

```typescript
import { getKnightRetreatOptions } from '../utils';

// Get all valid retreat options for a knight
const retreatOptions = getKnightRetreatOptions(
  originalPosition, 
  failedCapturePosition
);

// Check if a specific retreat is valid
const isValid = isValidKnightRetreatPosition(
  originalPosition,
  failedCapturePosition,
  retreatPosition
);

// Get the BP cost for a specific retreat
const cost = getKnightRetreatCost(
  originalPosition,
  failedCapturePosition,
  retreatPosition
);
```

### Implementation Notes

- The compressed data is decompressed on first use and cached in memory
- Browser environments use pako for decompression
- Node.js environments use the built-in zlib module
- No runtime dependency on the generator code

## Performance Benefits

- Near-instantaneous lookup performance vs. measurable computation time
- Small memory footprint (~2KB compressed)
- Improves game responsiveness on mobile devices
- Avoids complex pathfinding calculations at runtime
- Embedded data avoids separate network requests 