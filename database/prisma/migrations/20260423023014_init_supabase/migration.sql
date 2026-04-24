-- CreateEnum
CREATE TYPE "public"."Shift" AS ENUM ('Morning', 'Afternoon', 'Night');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('Low', 'Normal', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('Open', 'Monitoring', 'Resolved');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('OCC_STAFF', 'SUPERVISOR', 'MANAGEMENT_VIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ACKNOWLEDGED', 'CARRIED_FORWARD', 'DELETED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'OCC_STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Handover" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "handoverDate" DATE NOT NULL,
    "shift" "public"."Shift" NOT NULL,
    "preparedById" TEXT NOT NULL,
    "handedToId" TEXT,
    "overallPriority" "public"."Priority" NOT NULL,
    "overallStatus" "public"."ItemStatus" NOT NULL DEFAULT 'Open',
    "generalRemarks" TEXT,
    "nextShiftActions" TEXT,
    "isCarriedForward" BOOLEAN NOT NULL DEFAULT false,
    "carriedFromId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Handover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AircraftItem" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "type" TEXT,
    "issue" TEXT NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'Open',
    "priority" "public"."Priority" NOT NULL DEFAULT 'Normal',
    "flightsAffected" TEXT,
    "ownerId" TEXT,
    "dueTime" TIMESTAMP(3),
    "remarks" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AircraftItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AirportItem" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "airport" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'Open',
    "priority" "public"."Priority" NOT NULL DEFAULT 'Normal',
    "flightsAffected" TEXT,
    "ownerId" TEXT,
    "dueTime" TIMESTAMP(3),
    "remarks" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirportItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FlightScheduleItem" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "route" TEXT,
    "issue" TEXT NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'Open',
    "priority" "public"."Priority" NOT NULL DEFAULT 'Normal',
    "ownerId" TEXT,
    "dueTime" TIMESTAMP(3),
    "remarks" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrewItem" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "crewId" TEXT,
    "crewName" TEXT,
    "role" TEXT,
    "issue" TEXT NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'Open',
    "priority" "public"."Priority" NOT NULL DEFAULT 'Normal',
    "flightsAffected" TEXT,
    "ownerId" TEXT,
    "dueTime" TIMESTAMP(3),
    "remarks" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeatherItem" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "affectedArea" TEXT NOT NULL,
    "weatherType" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'Open',
    "priority" "public"."Priority" NOT NULL DEFAULT 'Normal',
    "flightsAffected" TEXT,
    "ownerId" TEXT,
    "dueTime" TIMESTAMP(3),
    "remarks" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemItem" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'Open',
    "priority" "public"."Priority" NOT NULL DEFAULT 'Normal',
    "ownerId" TEXT,
    "dueTime" TIMESTAMP(3),
    "remarks" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AbnormalEvent" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "flightsAffected" TEXT,
    "notificationRef" TEXT,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'Open',
    "priority" "public"."Priority" NOT NULL DEFAULT 'High',
    "ownerId" TEXT,
    "dueTime" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbnormalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "targetModel" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Acknowledgment" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Acknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Handover_referenceId_key" ON "public"."Handover"("referenceId");

-- CreateIndex
CREATE INDEX "Handover_handoverDate_shift_idx" ON "public"."Handover"("handoverDate", "shift");

-- CreateIndex
CREATE INDEX "Handover_overallStatus_idx" ON "public"."Handover"("overallStatus");

-- CreateIndex
CREATE INDEX "Handover_overallPriority_idx" ON "public"."Handover"("overallPriority");

-- CreateIndex
CREATE INDEX "Handover_deletedAt_idx" ON "public"."Handover"("deletedAt");

-- CreateIndex
CREATE INDEX "AircraftItem_handoverId_idx" ON "public"."AircraftItem"("handoverId");

-- CreateIndex
CREATE INDEX "AircraftItem_status_idx" ON "public"."AircraftItem"("status");

-- CreateIndex
CREATE INDEX "AircraftItem_deletedAt_idx" ON "public"."AircraftItem"("deletedAt");

-- CreateIndex
CREATE INDEX "AirportItem_handoverId_idx" ON "public"."AirportItem"("handoverId");

-- CreateIndex
CREATE INDEX "AirportItem_deletedAt_idx" ON "public"."AirportItem"("deletedAt");

-- CreateIndex
CREATE INDEX "FlightScheduleItem_handoverId_idx" ON "public"."FlightScheduleItem"("handoverId");

-- CreateIndex
CREATE INDEX "FlightScheduleItem_deletedAt_idx" ON "public"."FlightScheduleItem"("deletedAt");

-- CreateIndex
CREATE INDEX "CrewItem_handoverId_idx" ON "public"."CrewItem"("handoverId");

-- CreateIndex
CREATE INDEX "CrewItem_deletedAt_idx" ON "public"."CrewItem"("deletedAt");

-- CreateIndex
CREATE INDEX "WeatherItem_handoverId_idx" ON "public"."WeatherItem"("handoverId");

-- CreateIndex
CREATE INDEX "WeatherItem_deletedAt_idx" ON "public"."WeatherItem"("deletedAt");

-- CreateIndex
CREATE INDEX "SystemItem_handoverId_idx" ON "public"."SystemItem"("handoverId");

-- CreateIndex
CREATE INDEX "SystemItem_deletedAt_idx" ON "public"."SystemItem"("deletedAt");

-- CreateIndex
CREATE INDEX "AbnormalEvent_handoverId_idx" ON "public"."AbnormalEvent"("handoverId");

-- CreateIndex
CREATE INDEX "AbnormalEvent_status_idx" ON "public"."AbnormalEvent"("status");

-- CreateIndex
CREATE INDEX "AbnormalEvent_deletedAt_idx" ON "public"."AbnormalEvent"("deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_handoverId_idx" ON "public"."AuditLog"("handoverId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Acknowledgment_handoverId_userId_key" ON "public"."Acknowledgment"("handoverId", "userId");

-- AddForeignKey
ALTER TABLE "public"."Handover" ADD CONSTRAINT "Handover_carriedFromId_fkey" FOREIGN KEY ("carriedFromId") REFERENCES "public"."Handover"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Handover" ADD CONSTRAINT "Handover_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Handover" ADD CONSTRAINT "Handover_handedToId_fkey" FOREIGN KEY ("handedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AircraftItem" ADD CONSTRAINT "AircraftItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AirportItem" ADD CONSTRAINT "AirportItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FlightScheduleItem" ADD CONSTRAINT "FlightScheduleItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrewItem" ADD CONSTRAINT "CrewItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeatherItem" ADD CONSTRAINT "WeatherItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SystemItem" ADD CONSTRAINT "SystemItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AbnormalEvent" ADD CONSTRAINT "AbnormalEvent_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Acknowledgment" ADD CONSTRAINT "Acknowledgment_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "public"."Handover"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Acknowledgment" ADD CONSTRAINT "Acknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
