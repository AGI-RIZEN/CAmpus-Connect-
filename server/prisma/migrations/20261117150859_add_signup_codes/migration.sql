-- CreateTable
CREATE TABLE "SignupCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "note" TEXT,
    "generatedById" TEXT NOT NULL,
    "usedByUserId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignupCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignupCode_code_key" ON "SignupCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SignupCode_usedByUserId_key" ON "SignupCode"("usedByUserId");

-- CreateIndex
CREATE INDEX "SignupCode_role_usedByUserId_idx" ON "SignupCode"("role", "usedByUserId");

-- AddForeignKey
ALTER TABLE "SignupCode" ADD CONSTRAINT "SignupCode_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignupCode" ADD CONSTRAINT "SignupCode_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
