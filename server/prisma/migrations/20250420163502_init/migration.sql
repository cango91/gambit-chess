-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "resultReason" TEXT,
    "finalFEN" TEXT,
    "whitePlayerId" TEXT NOT NULL,
    "blackPlayerId" TEXT NOT NULL,
    "initialConfig" JSONB NOT NULL,
    "moveHistory" JSONB NOT NULL,
    CONSTRAINT "Game_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Game_whitePlayerId_idx" ON "Game"("whitePlayerId");

-- CreateIndex
CREATE INDEX "Game_blackPlayerId_idx" ON "Game"("blackPlayerId");

-- CreateIndex
CREATE INDEX "Game_createdAt_idx" ON "Game"("createdAt");
