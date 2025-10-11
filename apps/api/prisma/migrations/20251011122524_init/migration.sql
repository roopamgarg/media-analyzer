-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "brand_kits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "brand_kits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "brandKitId" TEXT,
    "postId" TEXT,
    "status" TEXT NOT NULL,
    "progress" INTEGER,
    "error" TEXT,
    "scores" TEXT,
    "flags" TEXT,
    "evidence" TEXT,
    "artifacts" TEXT,
    "timings" TEXT,
    "ruleset" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "analyses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analyses_brandKitId_fkey" FOREIGN KEY ("brandKitId") REFERENCES "brand_kits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
