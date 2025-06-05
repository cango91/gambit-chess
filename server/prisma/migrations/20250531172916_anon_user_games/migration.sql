-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "resultReason" TEXT,
    "finalFEN" TEXT,
    "whitePlayerId" TEXT,
    "blackPlayerId" TEXT,
    "anonymousUserId" TEXT,
    "initialConfig" JSONB NOT NULL,
    "moveHistory" JSONB NOT NULL,
    CONSTRAINT "Game_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Game_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("blackPlayerId", "createdAt", "endedAt", "finalFEN", "id", "initialConfig", "moveHistory", "result", "resultReason", "status", "whitePlayerId") SELECT "blackPlayerId", "createdAt", "endedAt", "finalFEN", "id", "initialConfig", "moveHistory", "result", "resultReason", "status", "whitePlayerId" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE INDEX "Game_whitePlayerId_idx" ON "Game"("whitePlayerId");
CREATE INDEX "Game_blackPlayerId_idx" ON "Game"("blackPlayerId");
CREATE INDEX "Game_anonymousUserId_idx" ON "Game"("anonymousUserId");
CREATE INDEX "Game_createdAt_idx" ON "Game"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
