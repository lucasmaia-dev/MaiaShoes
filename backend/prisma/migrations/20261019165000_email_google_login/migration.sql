ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL,
ADD COLUMN "email" VARCHAR(254),
ADD COLUMN "googleSub" VARCHAR(255);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

CREATE TABLE "GoogleLoginAttempt" (
  "stateHash" CHAR(64) NOT NULL,
  "browserHash" CHAR(64) NOT NULL,
  "nonce" CHAR(64) NOT NULL,
  "codeVerifier" VARCHAR(128) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleLoginAttempt_pkey" PRIMARY KEY ("stateHash")
);
CREATE INDEX "GoogleLoginAttempt_expiresAt_idx" ON "GoogleLoginAttempt"("expiresAt");
